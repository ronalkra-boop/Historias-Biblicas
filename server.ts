import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { getVoiceProfile } from './src/game/voiceProfiles.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

// In-memory cache for synthesized WAV clips so repeated lines play instantly
const MAX_TTS_CACHE = 120;
const ttsCache = new Map<string, string>();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateDramatizedSpeech(speaker: string, text: string): Promise<string> {
  const cleanSpeaker = speaker.trim() || 'Narrador';
  const cleanText = text.trim();
  const cacheKey = `${cleanSpeaker}::${cleanText}`;

  const cached = ttsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const profile = getVoiceProfile(cleanSpeaker);
  const ai = getGeminiClient();

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // Pass ONLY the spoken dialogue in `text` and pass tone cues silently in `speechMetadata.style`
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: profile.style,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: profile.voiceName,
              },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error('La respuesta de Gemini TTS no incluyó datos de audio.');
      }

      if (ttsCache.size >= MAX_TTS_CACHE) {
        const oldestKey = ttsCache.keys().next().value;
        if (oldestKey) ttsCache.delete(oldestKey);
      }
      ttsCache.set(cacheKey, base64Audio);
      return base64Audio;
    } catch (err) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      // Do not burn seconds retrying hard quota or permission responses
      if (
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('403') ||
        errMsg.includes('PERMISSION_DENIED')
      ) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('No se pudo sintetizar la voz dramatizada.');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      ttsConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.post('/api/tts', async (req, res) => {
    const body = req.body as { speaker?: unknown; text?: unknown };
    const speaker = typeof body?.speaker === 'string' ? body.speaker.slice(0, 80) : 'Narrador';
    const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 500) : '';

    if (!text) {
      res.status(400).json({ error: 'El texto del diálogo es obligatorio.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.json({ fallback: true, reason: 'unconfigured' });
      return;
    }

    try {
      const audioBase64 = await generateDramatizedSpeech(speaker, text);
      res.json({
        audioBase64,
        mimeType: 'audio/wav',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al generar el audio dramatizado.';
      const isQuotaOrAuth =
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('403') ||
        message.includes('PERMISSION_DENIED');
      if (isQuotaOrAuth) {
        res.json({ fallback: true, reason: 'quota' });
        return;
      }
      res.json({ fallback: true, reason: 'transient' });
    }
  });

  const publicDir = isProduction
    ? path.resolve(__dirname, 'dist')
    : path.resolve(__dirname, 'public');

  app.get('/manifest.webmanifest', (_req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(publicDir, 'manifest.webmanifest'));
  });

  app.get('/sw.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(publicDir, 'sw.js'));
  });

  // Self-healing cleanup worker for any device that previously installed the old dev-sw.js
  app.get('/dev-sw.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(`self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});`);
  });

  app.get('/registerSW.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(`if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
  });
}`);
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Historias Bíblicas server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
