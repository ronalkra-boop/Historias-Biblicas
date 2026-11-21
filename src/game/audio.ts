import type { StageId } from './types';
import { getVoiceProfile } from './voiceProfiles';

export type MusicTheme = 'none' | 'title' | StageId;

export interface SpeechCallbacks {
  onSpeakingChange?: (speaking: boolean, speaker?: string) => void;
  onSpeechError?: (message: string) => void;
}

export interface AudioController {
  unlock(): void;
  isUnlocked(): boolean;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  setVoiceEnabled(enabled: boolean): void;
  isVoiceEnabled(): boolean;
  setMusicEnabled(enabled: boolean): void;
  isMusicEnabled(): boolean;
  setMusicTheme(theme: MusicTheme): void;
  setServerTtsAvailable(available: boolean): void;
  speakDialogue(
    cueId: number,
    speaker: string,
    text: string,
    callbacks?: SpeechCallbacks
  ): Promise<void>;
  stopSpeech(): void;
  playJump(): void;
  playLand(): void;
  playCollect(): void;
  playInteract(): void;
  playJesusCall(): void;
  playPray(): void;
  playCalmLion(): void;
  playSling(): void;
  playTelegraph(): void;
  playHurt(): void;
  playVictory(): void;
  playDefeat(): void;
}

interface ThemePattern {
  stepMs: number;
  notes: number[];
  bass: number[];
  waveform: OscillatorType;
  padFreq: number;
  chime?: boolean;
  handDrum?: boolean;
}

const THEME_PATTERNS: Record<Exclude<MusicTheme, 'none'>, ThemePattern> = {
  title: {
    stepMs: 560,
    notes: [293.66, 369.99, 440.0, 587.33, 440.0, 369.99, 329.63, 440.0],
    bass: [146.83, 0, 146.83, 0, 164.81, 0, 146.83, 0],
    waveform: 'triangle',
    padFreq: 146.83,
  },
  jericho_road: {
    stepMs: 360,
    notes: [293.66, 349.23, 369.99, 440.0, 493.88, 440.0, 369.99, 349.23, 293.66, 440.0, 523.25, 440.0],
    bass: [146.83, 0, 0, 220.0, 146.83, 0, 196.0, 0, 146.83, 0, 220.0, 0],
    waveform: 'triangle',
    padFreq: 146.83,
    handDrum: true,
  },
  zaqueo_house: {
    stepMs: 330,
    notes: [329.63, 392.0, 440.0, 523.25, 659.25, 587.33, 523.25, 392.0],
    bass: [130.81, 0, 196.0, 0, 174.61, 0, 196.0, 0],
    waveform: 'triangle',
    padFreq: 130.81,
    chime: true,
  },
  babylon_terrace: {
    stepMs: 520,
    notes: [246.94, 293.66, 369.99, 440.0, 369.99, 329.63, 293.66, 246.94],
    bass: [123.47, 0, 0, 185.0, 123.47, 0, 146.83, 0],
    waveform: 'sine',
    padFreq: 123.47,
  },
  lions_den: {
    stepMs: 480,
    notes: [220.0, 261.63, 329.63, 392.0, 440.0, 392.0, 329.63, 261.63],
    bass: [110.0, 0, 164.81, 0, 110.0, 0, 146.83, 0],
    waveform: 'sine',
    padFreq: 110.0,
    chime: true,
  },
  valley_elah: {
    stepMs: 340,
    notes: [293.66, 329.63, 440.0, 587.33, 440.0, 392.0, 329.63, 293.66],
    bass: [146.83, 0, 220.0, 0, 196.0, 0, 146.83, 0],
    waveform: 'triangle',
    padFreq: 146.83,
    handDrum: true,
  },
  fiery_furnace: {
    stepMs: 440,
    notes: [261.63, 329.63, 392.0, 493.88, 523.25, 493.88, 392.0, 329.63],
    bass: [130.81, 0, 196.0, 0, 130.81, 0, 164.81, 0],
    waveform: 'sine',
    padFreq: 130.81,
    chime: true,
  },
  red_sea: {
    stepMs: 350,
    notes: [246.94, 329.63, 369.99, 493.88, 587.33, 493.88, 369.99, 329.63],
    bass: [123.47, 0, 185.0, 0, 146.83, 0, 185.0, 0],
    waveform: 'triangle',
    padFreq: 123.47,
    handDrum: true,
  },
  noah_ark: {
    stepMs: 460,
    notes: [261.63, 293.66, 349.23, 392.0, 440.0, 392.0, 349.23, 293.66],
    bass: [130.81, 0, 174.61, 0, 130.81, 0, 196.0, 0],
    waveform: 'triangle',
    padFreq: 130.81,
    chime: true,
  },
  capernaum_crowd: {
    stepMs: 380,
    notes: [293.66, 349.23, 440.0, 523.25, 440.0, 392.0, 349.23, 293.66],
    bass: [146.83, 0, 220.0, 0, 174.61, 0, 146.83, 0],
    waveform: 'triangle',
    padFreq: 146.83,
  },
  jericho_gate: {
    stepMs: 420,
    notes: [261.63, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63],
    bass: [130.81, 0, 196.0, 0, 174.61, 0, 196.0, 0],
    waveform: 'sine',
    padFreq: 130.81,
    chime: true,
  },
  galilee_hills: {
    stepMs: 410,
    notes: [329.63, 392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 392.0],
    bass: [164.81, 0, 246.94, 0, 196.0, 0, 164.81, 0],
    waveform: 'triangle',
    padFreq: 164.81,
    chime: true,
  },
  galilee_storm: {
    stepMs: 330,
    notes: [220.0, 261.63, 311.13, 392.0, 349.23, 311.13, 261.63, 220.0],
    bass: [110.0, 0, 164.81, 0, 130.81, 0, 146.83, 0],
    waveform: 'sine',
    padFreq: 110.0,
    handDrum: true,
  },
};

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function createAudioController(): AudioController {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let musicGain: GainNode | null = null;
  let sfxGain: GainNode | null = null;
  let voiceGain: GainNode | null = null;

  let padOscA: OscillatorNode | null = null;
  let padOscB: OscillatorNode | null = null;
  let padGain: GainNode | null = null;

  let muted = false;
  let unlocked = false;
  let voiceEnabled = true;
  let musicEnabled = true;
  let serverTtsAvailable = true;
  let serverTtsCooldownUntil = 0;
  let isDucking = false;
  let currentTheme: MusicTheme = 'none';
  let stepIndex = 0;
  let musicTimerId: number | null = null;

  let activeSpeechGen = 0;
  let activeAbort: AbortController | null = null;
  let activeVoiceSource: AudioBufferSourceNode | null = null;
  let speechSafetyTimer: number | null = null;
  const decodedVoiceCache = new Map<string, AudioBuffer>();
  const rawBase64Cache = new Map<string, string>();

  function getMusicTargetVolume(): number {
    if (muted || !musicEnabled || currentTheme === 'none') return 0.0001;
    return isDucking ? 0.055 : 0.2;
  }

  function applyGainLevels() {
    if (!ctx || !masterGain || !musicGain || !voiceGain || !sfxGain) return;
    const now = ctx.currentTime;
    masterGain.gain.setTargetAtTime(muted ? 0.0001 : 1.0, now, 0.04);
    musicGain.gain.setTargetAtTime(getMusicTargetVolume(), now, 0.14);
    sfxGain.gain.setTargetAtTime(muted ? 0.0001 : 0.85, now, 0.04);
    voiceGain.gain.setTargetAtTime(muted || !voiceEnabled ? 0.0001 : 1.0, now, 0.04);
  }

  function ensureContext(allowCreate = unlocked): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!ctx && !allowCreate) return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;

    if (!ctx) {
      try {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        musicGain = ctx.createGain();
        sfxGain = ctx.createGain();
        voiceGain = ctx.createGain();

        musicGain.connect(masterGain);
        sfxGain.connect(masterGain);
        voiceGain.connect(masterGain);
        masterGain.connect(ctx.destination);

        applyGainLevels();
      } catch {
        return null;
      }
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function stopPad() {
    if (padOscA) {
      try {
        padOscA.stop();
        padOscA.disconnect();
      } catch {
        // ignore
      }
      padOscA = null;
    }
    if (padOscB) {
      try {
        padOscB.stop();
        padOscB.disconnect();
      } catch {
        // ignore
      }
      padOscB = null;
    }
    if (padGain) {
      try {
        padGain.disconnect();
      } catch {
        // ignore
      }
      padGain = null;
    }
  }

  function startPad(freq: number) {
    const audio = ensureContext();
    if (!audio || !musicGain) return;
    stopPad();

    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 460;

    padGain = audio.createGain();
    padGain.gain.value = 0.08;

    padOscA = audio.createOscillator();
    padOscA.type = 'sine';
    padOscA.frequency.value = freq;

    padOscB = audio.createOscillator();
    padOscB.type = 'triangle';
    padOscB.frequency.value = freq * 1.5;

    padOscA.connect(filter);
    padOscB.connect(filter);
    filter.connect(padGain);
    padGain.connect(musicGain);

    padOscA.start();
    padOscB.start();
  }

  function playPluckedNote(freq: number, type: OscillatorType, volume: number, duration: number) {
    const audio = ensureContext();
    if (!audio || !musicGain || audio.state !== 'running') return;
    const now = audio.currentTime;

    const osc = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(380, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.022);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(musicGain);

    osc.start(now);
    osc.stop(now + duration + 0.04);
  }

  function playSoftHandDrum(accent: boolean) {
    const audio = ensureContext();
    if (!audio || !musicGain || audio.state !== 'running') return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(accent ? 135 : 105, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.09);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(accent ? 0.1 : 0.055, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  function scheduleMusicLoop() {
    if (musicTimerId !== null) {
      window.clearInterval(musicTimerId);
      musicTimerId = null;
    }
    if (currentTheme === 'none' || !musicEnabled || !unlocked) {
      stopPad();
      return;
    }

    const pattern = THEME_PATTERNS[currentTheme];
    startPad(pattern.padFreq);
    stepIndex = 0;

    const tick = () => {
      if (muted || !musicEnabled || currentTheme === 'none') return;
      const activePattern = THEME_PATTERNS[currentTheme];
      const audio = ensureContext();
      if (!audio || audio.state !== 'running') return;

      const n = activePattern.notes[stepIndex % activePattern.notes.length];
      if (n > 0) {
        playPluckedNote(n, activePattern.waveform, 0.13, (activePattern.stepMs / 1000) * 1.45);
      }

      const b = activePattern.bass[stepIndex % activePattern.bass.length];
      if (b > 0) {
        playPluckedNote(b, 'sine', 0.14, (activePattern.stepMs / 1000) * 1.9);
      }

      if (activePattern.chime && stepIndex % 4 === 0) {
        playPluckedNote(n * 2, 'sine', 0.045, 1.1);
      }

      if (activePattern.handDrum && stepIndex % 2 === 0) {
        playSoftHandDrum(stepIndex % 4 === 0);
      }

      stepIndex += 1;
    };

    musicTimerId = window.setInterval(tick, pattern.stepMs);
  }

  function stopSpeechInternal() {
    activeSpeechGen += 1;
    if (speechSafetyTimer !== null) {
      window.clearTimeout(speechSafetyTimer);
      speechSafetyTimer = null;
    }
    if (activeAbort) {
      activeAbort.abort();
      activeAbort = null;
    }
    if (activeVoiceSource) {
      try {
        activeVoiceSource.onended = null;
        activeVoiceSource.stop();
        activeVoiceSource.disconnect();
      } catch {
        // ignore
      }
      activeVoiceSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // ignore
      }
    }
    isDucking = false;
    applyGainLevels();
  }

  function speakWithBrowserSynthesis(
    myGen: number,
    speaker: string,
    cleanText: string,
    callbacks?: SpeechCallbacks
  ): boolean {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return false;
    }

    try {
      const profile = getVoiceProfile(speaker);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith('es-')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('es'));
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }
      utterance.lang = spanishVoice?.lang || 'es-ES';
      utterance.pitch = profile.pitch;
      utterance.rate = profile.rate;
      utterance.volume = 1;

      const finish = () => {
        if (speechSafetyTimer !== null) {
          window.clearTimeout(speechSafetyTimer);
          speechSafetyTimer = null;
        }
        if (myGen === activeSpeechGen) {
          isDucking = false;
          applyGainLevels();
          callbacks?.onSpeakingChange?.(false);
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      isDucking = true;
      applyGainLevels();
      callbacks?.onSpeakingChange?.(true, speaker);

      const triggerSpeak = () => {
        if (myGen !== activeSpeechGen) return;
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        window.setTimeout(triggerSpeak, 45);
      } else {
        triggerSpeak();
      }

      const estimatedMs = Math.min(12000, Math.max(2400, cleanText.length * 95));
      speechSafetyTimer = window.setTimeout(finish, estimatedMs);
      return true;
    } catch {
      return false;
    }
  }

  function tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainLevel = 0.08,
    slideTo?: number,
    delay = 0,
    jitter = 0.06
  ) {
    const audio = ensureContext();
    if (!audio || muted || !sfxGain) return;
    const now = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const variedFreq = freq * (1 + (Math.random() * 2 - 1) * jitter);
    osc.type = type;
    osc.frequency.setValueAtTime(variedFreq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainLevel, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  return {
    unlock() {
      unlocked = true;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.getVoices();
        } catch {
          // ignore
        }
      }
      const audio = ensureContext(true);
      if (audio && currentTheme !== 'none' && musicEnabled && musicTimerId === null) {
        scheduleMusicLoop();
      }
    },
    isUnlocked() {
      return unlocked;
    },
    setMuted(next: boolean) {
      muted = next;
      if (muted) {
        stopSpeechInternal();
      }
      applyGainLevels();
    },
    isMuted() {
      return muted;
    },
    setVoiceEnabled(enabled: boolean) {
      voiceEnabled = enabled;
      if (!voiceEnabled) {
        stopSpeechInternal();
      }
      applyGainLevels();
    },
    isVoiceEnabled() {
      return voiceEnabled;
    },
    setMusicEnabled(enabled: boolean) {
      musicEnabled = enabled;
      if (!musicEnabled) {
        if (musicTimerId !== null) {
          window.clearInterval(musicTimerId);
          musicTimerId = null;
        }
        stopPad();
      } else if (currentTheme !== 'none') {
        scheduleMusicLoop();
      }
      applyGainLevels();
    },
    isMusicEnabled() {
      return musicEnabled;
    },
    setMusicTheme(theme: MusicTheme) {
      if (theme === currentTheme && (theme === 'none' || musicTimerId !== null)) {
        return;
      }
      currentTheme = theme;
      scheduleMusicLoop();
      applyGainLevels();
    },
    setServerTtsAvailable(available: boolean) {
      serverTtsAvailable = available;
    },
    stopSpeech() {
      stopSpeechInternal();
    },
    async speakDialogue(
      _cueId: number,
      speaker: string,
      text: string,
      callbacks?: SpeechCallbacks
    ) {
      stopSpeechInternal();
      const cleanText = text.trim();
      if (muted || !voiceEnabled || !cleanText) {
        callbacks?.onSpeakingChange?.(false);
        return;
      }

      const myGen = activeSpeechGen;

      if (!serverTtsAvailable || Date.now() < serverTtsCooldownUntil) {
        const started = speakWithBrowserSynthesis(myGen, speaker, cleanText, callbacks);
        if (!started) {
          callbacks?.onSpeakingChange?.(false);
        }
        return;
      }

      const cacheKey = `${speaker}::${cleanText}`;
      const audio = ensureContext();
      if (!audio || !voiceGain) return;

      try {
        let buffer = decodedVoiceCache.get(cacheKey);
        if (!buffer) {
          let base64 = rawBase64Cache.get(cacheKey);
          if (!base64) {
            const controller = new AbortController();
            activeAbort = controller;
            const res = await fetch('/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ speaker, text: cleanText }),
              signal: controller.signal,
            });
            if (myGen !== activeSpeechGen) return;

            const payload = (await res.json()) as {
              audioBase64?: string;
              fallback?: boolean;
              reason?: string;
              error?: string;
            };

            if (payload.fallback) {
              if (payload.reason === 'quota') {
                serverTtsCooldownUntil = Date.now() + 45_000;
              }
              const started = speakWithBrowserSynthesis(myGen, speaker, cleanText, callbacks);
              if (!started) {
                callbacks?.onSpeakingChange?.(false);
              }
              return;
            }

            if (!res.ok || !payload.audioBase64) {
              throw new Error(
                payload.error || 'No se pudo obtener la voz dramatizada.'
              );
            }
            base64 = payload.audioBase64;
            rawBase64Cache.set(cacheKey, base64);
          }

          if (audio.state === 'suspended') {
            await audio.resume().catch(() => {});
          }
          const arrayBuffer = base64ToArrayBuffer(base64);
          buffer = await audio.decodeAudioData(arrayBuffer);
          if (myGen !== activeSpeechGen) return;
          decodedVoiceCache.set(cacheKey, buffer);
        }

        if (myGen !== activeSpeechGen || muted || !voiceEnabled) return;
        if (audio.state === 'suspended') {
          await audio.resume().catch(() => {});
        }

        const source = audio.createBufferSource();
        source.buffer = buffer;
        source.connect(voiceGain);
        activeVoiceSource = source;

        isDucking = true;
        applyGainLevels();
        callbacks?.onSpeakingChange?.(true, speaker);

        source.onended = () => {
          if (activeVoiceSource === source) {
            activeVoiceSource = null;
          }
          if (myGen === activeSpeechGen) {
            isDucking = false;
            applyGainLevels();
            callbacks?.onSpeakingChange?.(false);
          }
        };

        source.start();
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (myGen === activeSpeechGen) {
          // Graceful Spanish SpeechSynthesis fallback so story narration is always audible
          const started = speakWithBrowserSynthesis(myGen, speaker, cleanText, callbacks);
          if (!started) {
            isDucking = false;
            applyGainLevels();
            callbacks?.onSpeakingChange?.(false);
            const msg =
              err instanceof Error
                ? err.message
                : 'Error al reproducir la voz dramatizada.';
            callbacks?.onSpeechError?.(msg);
          }
        }
      }
    },
    playJump() {
      tone(310, 0.14, 'triangle', 0.09, 520, 0, 0.08);
    },
    playLand() {
      tone(135, 0.08, 'sine', 0.06, 75, 0, 0.08);
    },
    playCollect() {
      tone(587, 0.12, 'triangle', 0.09, undefined, 0, 0.04);
      tone(880, 0.18, 'sine', 0.09, undefined, 0.07, 0.03);
    },
    playInteract() {
      tone(440, 0.1, 'triangle', 0.08, 660, 0, 0.05);
    },
    playJesusCall() {
      tone(392, 0.18, 'sine', 0.08, undefined, 0, 0.02);
      tone(493.88, 0.18, 'sine', 0.08, undefined, 0.11, 0.02);
      tone(587.33, 0.34, 'triangle', 0.09, undefined, 0.22, 0.02);
    },
    playPray() {
      tone(523.25, 0.2, 'sine', 0.07, undefined, 0, 0.02);
      tone(659.25, 0.28, 'triangle', 0.08, undefined, 0.1, 0.02);
    },
    playCalmLion() {
      tone(392, 0.16, 'sine', 0.08, undefined, 0, 0.02);
      tone(523.25, 0.18, 'sine', 0.08, undefined, 0.09, 0.02);
      tone(783.99, 0.36, 'triangle', 0.09, undefined, 0.18, 0.02);
    },
    playSling() {
      tone(280, 0.12, 'triangle', 0.09, 760, 0, 0.05);
    },
    playTelegraph() {
      tone(210, 0.16, 'sawtooth', 0.045, 290, 0, 0.05);
    },
    playHurt() {
      tone(220, 0.18, 'sawtooth', 0.08, 110, 0, 0.04);
    },
    playVictory() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => {
        tone(
          n,
          idx === notes.length - 1 ? 0.45 : 0.18,
          'triangle',
          0.09,
          undefined,
          idx * 0.11,
          0.01
        );
      });
    },
    playDefeat() {
      tone(329.63, 0.22, 'triangle', 0.07, undefined, 0, 0.01);
      tone(293.66, 0.22, 'triangle', 0.07, undefined, 0.16, 0.01);
      tone(246.94, 0.42, 'sine', 0.08, undefined, 0.32, 0.01);
    },
  };
}
