import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { OfflineBanner } from './components/OfflineBanner';
import { RotateDeviceOverlay } from './components/RotateDeviceOverlay';
import { StatusModal } from './components/StatusModal';
import { TitleScreen } from './components/TitleScreen';
import { createAudioController, type AudioController, type MusicTheme } from './game/audio';
import { STORY_CATALOG } from './game/catalog';
import { getStageFrameColors, renderWorld } from './game/renderer';
import {
  VIEW_HEIGHT,
  VIEW_WIDTH,
  buildHudSnapshot,
  buildRunSummary,
  createInputState,
  createStoryWorld,
  loadProgress,
  replayLastDialogue,
  saveRunProgress,
  stepWorld,
} from './game/rules';
import type {
  GamePhase,
  GameWorld,
  HudSnapshot,
  RunSummary,
  StoryId,
  StoryProgress,
} from './game/types';
import {
  canUseFullscreen,
  exitLandscapeFullscreen,
  isFullscreenActive,
  readCurrentViewportLayout,
  requestLandscapeFullscreen,
  type ViewportLayoutState,
} from './utils/orientation';

function isValidStoryId(val: string | null): val is StoryId {
  return Boolean(val && STORY_CATALOG.some((s) => s.id === val));
}

function getThemeForWorld(phase: GamePhase, world: GameWorld): MusicTheme {
  if (phase === 'title') return 'title';
  return world.stage;
}

function drawSceneToCanvas(
  canvas: HTMLCanvasElement,
  world: GameWorld,
  isSpeaking: boolean
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const cssW = canvas.clientWidth || VIEW_WIDTH;
  const cssH = canvas.clientHeight || VIEW_HEIGHT;
  const targetW = Math.round(cssW * dpr);
  const targetH = Math.round(cssH * dpr);

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const scale = Math.min(cssW / VIEW_WIDTH, cssH / VIEW_HEIGHT);
  const viewDrawW = VIEW_WIDTH * scale;
  const viewDrawH = VIEW_HEIGHT * scale;
  const offsetX = (cssW - viewDrawW) / 2;
  const offsetY = (cssH - viewDrawH) / 2;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const frameColors = getStageFrameColors(world);
  const horizonY = offsetY + (world.groundY / VIEW_HEIGHT) * viewDrawH;
  const skyGrad = ctx.createLinearGradient(0, 0, 0, Math.max(1, horizonY));
  skyGrad.addColorStop(0, frameColors.top);
  skyGrad.addColorStop(1, frameColors.top);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, cssW, Math.max(0, horizonY) + 2);
  ctx.fillStyle = frameColors.bottom;
  ctx.fillRect(0, Math.max(0, horizonY), cssW, cssH - Math.max(0, horizonY) + 2);

  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, offsetX * dpr, offsetY * dpr);
  renderWorld(ctx, world, isSpeaking);
}

export default function App() {
  const [selectedStory, setSelectedStory] = useState<StoryId>(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('story');
    return isValidStoryId(s) ? s : 'zaqueo';
  });

  const [phase, setPhase] = useState<GamePhase>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1' ? 'playing' : 'title';
  });

  const [progress, setProgress] = useState<StoryProgress>(() => loadProgress());
  const [muted, setMuted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [viewport, setViewport] = useState<ViewportLayoutState>(() => readCurrentViewportLayout());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => isFullscreenActive());
  const [portraitBypassed, setPortraitBypassed] = useState(false);
  const canFullscreen = canUseFullscreen();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<AudioController | null>(null);
  if (!audioRef.current) {
    audioRef.current = createAudioController();
  }

  const worldRef = useRef<GameWorld>(createStoryWorld(selectedStory));
  const inputRef = useRef(createInputState());
  const phaseRef = useRef<GamePhase>(phase);
  const selectedStoryRef = useRef<StoryId>(selectedStory);
  const viewportRef = useRef<ViewportLayoutState>(viewport);
  const voiceEnabledRef = useRef(voiceEnabled);
  const isSpeakingRef = useRef(isSpeaking);
  const lastSpokenCueIdRef = useRef<number>(0);
  const [hud, setHud] = useState<HudSnapshot>(() => buildHudSnapshot(worldRef.current));

  const showRotatePrompt =
    phase === 'playing' && viewport.isMobileLike && viewport.isPortrait && !portraitBypassed;
  const showRotatePromptRef = useRef(showRotatePrompt);

  phaseRef.current = phase;
  selectedStoryRef.current = selectedStory;
  viewportRef.current = viewport;
  voiceEnabledRef.current = voiceEnabled;
  isSpeakingRef.current = isSpeaking;
  showRotatePromptRef.current = showRotatePrompt;

  // Track viewport size, orientation, and fullscreen state cleanly across phone rotations
  useEffect(() => {
    const syncLayout = () => {
      const next = readCurrentViewportLayout();
      setViewport(next);
      setIsFullscreen(isFullscreenActive());
      if (canvasRef.current && phaseRef.current !== 'title') {
        drawSceneToCanvas(canvasRef.current, worldRef.current, isSpeakingRef.current);
      }
    };

    window.addEventListener('resize', syncLayout);
    window.addEventListener('orientationchange', syncLayout);
    document.addEventListener('fullscreenchange', syncLayout);
    const screenOrientation = (
      screen as Screen & { orientation?: EventTarget }
    ).orientation;
    screenOrientation?.addEventListener?.('change', syncLayout);

    return () => {
      window.removeEventListener('resize', syncLayout);
      window.removeEventListener('orientationchange', syncLayout);
      document.removeEventListener('fullscreenchange', syncLayout);
      screenOrientation?.removeEventListener?.('change', syncLayout);
    };
  }, []);

  // Check server TTS capability once on mount so missing API keys don't emit 503 console noise
  useEffect(() => {
    let active = true;
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ttsConfigured?: boolean } | null) => {
        if (active && data && typeof data.ttsConfigured === 'boolean') {
          audioRef.current?.setServerTtsAvailable(data.ttsConfigured);
        }
      })
      .catch(() => {
        // ignore transient health check failure
      });
    return () => {
      active = false;
    };
  }, []);

  // Sync body[data-state]
  useEffect(() => {
    document.body.dataset.state = phase;
  }, [phase]);

  const speakCueIfNeeded = useCallback((world: GameWorld) => {
    const audio = audioRef.current;
    if (!audio || !audio.isUnlocked() || !voiceEnabledRef.current) return;
    if (!world.dialogue) return;
    if (world.dialogue.id === lastSpokenCueIdRef.current) return;

    lastSpokenCueIdRef.current = world.dialogue.id;
    audio.speakDialogue(world.dialogue.id, world.dialogue.speaker, world.dialogue.text, {
      onSpeakingChange: (speaking) => {
        setIsSpeaking(speaking);
      },
      onSpeechError: (msg) => {
        setSpeechError(msg);
      },
    });
  }, []);

  const unlockAudioFromGesture = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasUnlocked = audio.isUnlocked();
    audio.unlock();
    if (!wasUnlocked) {
      audio.setMusicTheme(getThemeForWorld(phaseRef.current, worldRef.current));
      if (phaseRef.current === 'playing') {
        speakCueIfNeeded(worldRef.current);
      }
    }
  }, [speakCueIfNeeded]);

  const handleRequestLandscape = useCallback(() => {
    unlockAudioFromGesture();
    void requestLandscapeFullscreen().then(({ fullscreen }) => {
      setIsFullscreen(fullscreen);
      setViewport(readCurrentViewportLayout());
    });
  }, [unlockAudioFromGesture]);

  const handleToggleFullscreen = useCallback(() => {
    unlockAudioFromGesture();
    if (isFullscreenActive()) {
      void exitLandscapeFullscreen().then(() => {
        setIsFullscreen(false);
        setViewport(readCurrentViewportLayout());
      });
    } else {
      void requestLandscapeFullscreen().then(({ fullscreen }) => {
        setIsFullscreen(fullscreen);
        setViewport(readCurrentViewportLayout());
      });
    }
  }, [unlockAudioFromGesture]);

  const startStory = useCallback(
    (story: StoryId, fromGesture = true) => {
      if (fromGesture) {
        audioRef.current?.unlock();
        if (viewportRef.current.isMobileLike) {
          void requestLandscapeFullscreen().then(({ fullscreen }) => {
            setIsFullscreen(fullscreen);
            setViewport(readCurrentViewportLayout());
          });
        }
      }
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      audioRef.current?.stopSpeech();
      setIsSpeaking(false);
      setSpeechError(null);
      lastSpokenCueIdRef.current = 0;

      const fresh = createStoryWorld(story);
      worldRef.current = fresh;
      inputRef.current = createInputState();
      setSelectedStory(story);
      setSummary(null);
      setHud(buildHudSnapshot(fresh));
      setPhase('playing');

      if (audioRef.current?.isUnlocked()) {
        audioRef.current.setMusicTheme(getThemeForWorld('playing', fresh));
        speakCueIfNeeded(fresh);
      }
    },
    [speakCueIfNeeded]
  );

  const handleReplayDialogue = useCallback(() => {
    unlockAudioFromGesture();
    if (phaseRef.current !== 'playing') return;
    if (replayLastDialogue(worldRef.current)) {
      lastSpokenCueIdRef.current = 0;
      speakCueIfNeeded(worldRef.current);
      if (canvasRef.current) {
        drawSceneToCanvas(canvasRef.current, worldRef.current, isSpeakingRef.current);
      }
    }
  }, [speakCueIfNeeded, unlockAudioFromGesture]);

  const toggleMute = useCallback(() => {
    unlockAudioFromGesture();
    const audio = audioRef.current;
    if (!audio) return;
    const next = !audio.isMuted();
    audio.setMuted(next);
    setMuted(next);
    if (next) setIsSpeaking(false);
  }, [unlockAudioFromGesture]);

  const toggleVoice = useCallback(() => {
    unlockAudioFromGesture();
    const audio = audioRef.current;
    if (!audio) return;
    const next = !audio.isVoiceEnabled();
    audio.setVoiceEnabled(next);
    setVoiceEnabled(next);
    if (!next) {
      setIsSpeaking(false);
    } else if (phaseRef.current === 'playing') {
      lastSpokenCueIdRef.current = 0;
      speakCueIfNeeded(worldRef.current);
    }
  }, [speakCueIfNeeded, unlockAudioFromGesture]);

  const handlePauseToggle = useCallback(() => {
    unlockAudioFromGesture();
    if (phaseRef.current === 'playing') {
      audioRef.current?.stopSpeech();
      setIsSpeaking(false);
      setPhase('paused');
    } else if (phaseRef.current === 'paused') {
      setPhase('playing');
    }
  }, [unlockAudioFromGesture]);

  const handleMainMenu = useCallback(() => {
    audioRef.current?.stopSpeech();
    setIsSpeaking(false);
    setSummary(null);
    setPhase('title');
    if (audioRef.current?.isUnlocked()) {
      audioRef.current.setMusicTheme('title');
    }
  }, []);

  const handleTouchKey = useCallback(
    (code: string, down: boolean) => {
      unlockAudioFromGesture();
      if (down) {
        if (!inputRef.current.held.has(code)) {
          inputRef.current.justPressed.add(code);
        }
        inputRef.current.held.add(code);
      } else {
        inputRef.current.held.delete(code);
      }
    },
    [unlockAudioFromGesture]
  );

  // Sync music theme whenever phase changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.isUnlocked()) return;
    audio.setMusicTheme(getThemeForWorld(phase, worldRef.current));
  }, [phase]);

  // Global keyboard input & hotkeys
  useEffect(() => {
    const gameKeys = new Set([
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Space',
      'KeyA',
      'KeyD',
      'KeyW',
      'KeyS',
      'KeyE',
      'KeyF',
      'Enter',
    ]);

    const onKeyDown = (e: KeyboardEvent) => {
      unlockAudioFromGesture();
      if (gameKeys.has(e.code) && phaseRef.current === 'playing') {
        e.preventDefault();
      }
      if (!e.repeat) {
        if (phaseRef.current === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
          const activeTag = document.activeElement?.tagName;
          if (activeTag !== 'BUTTON' && activeTag !== 'A' && activeTag !== 'INPUT') {
            e.preventDefault();
            startStory(selectedStoryRef.current, true);
            return;
          }
        }
        if (e.code === 'KeyP' || e.code === 'Escape') {
          if (phaseRef.current === 'playing' || phaseRef.current === 'paused') {
            handlePauseToggle();
            return;
          }
        }
        if (e.code === 'KeyH' && phaseRef.current === 'playing') {
          e.preventDefault();
          handleReplayDialogue();
          return;
        }
        if (e.code === 'KeyM') {
          toggleMute();
          return;
        }
        if (e.code === 'KeyV') {
          toggleVoice();
          return;
        }
        if (e.code === 'KeyR' && phaseRef.current !== 'title') {
          startStory(worldRef.current.story, true);
          return;
        }
        inputRef.current.justPressed.add(e.code);
      }
      inputRef.current.held.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      inputRef.current.held.delete(e.code);
    };

    const onBlur = () => {
      inputRef.current.held.clear();
      inputRef.current.justPressed.clear();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        onBlur();
      }
    };

    const onFirstPointer = () => {
      unlockAudioFromGesture();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pointerdown', onFirstPointer);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pointerdown', onFirstPointer);
    };
  }, [
    handlePauseToggle,
    handleReplayDialogue,
    startStory,
    toggleMute,
    toggleVoice,
    unlockAudioFromGesture,
  ]);

  // Draw paused/gameover static frame cleanly once & on resize, without spinning rAF
  useEffect(() => {
    if (phase !== 'paused' && phase !== 'gameover') return;
    const drawStatic = () => {
      if (canvasRef.current) {
        drawSceneToCanvas(canvasRef.current, worldRef.current, false);
      }
    };
    drawStatic();
    window.addEventListener('resize', drawStatic);
    return () => window.removeEventListener('resize', drawStatic);
  }, [phase]);

  // Active simulation + render loop ONLY while phase === 'playing'
  useEffect(() => {
    if (phase !== 'playing') return;

    let rafId = 0;
    let yieldTimerId: number | null = null;
    let lastTime = performance.now();
    let hudAccumulator = 0;
    let disposed = false;

    const scheduleNext = (delayMs = 0) => {
      if (disposed) return;
      if (delayMs > 0) {
        yieldTimerId = window.setTimeout(() => {
          if (!disposed) {
            rafId = window.requestAnimationFrame(loop);
          }
        }, delayMs);
      } else {
        rafId = window.requestAnimationFrame(loop);
      }
    };

    const loop = (now: number) => {
      if (disposed || phaseRef.current !== 'playing') return;
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const world = worldRef.current;
      const audio = audioRef.current;
      const frameStart = performance.now();
      const prevStage = world.stage;

      // Pause simulation cleanly while mobile portrait rotate prompt is displayed
      if (showRotatePromptRef.current) {
        if (canvasRef.current) {
          drawSceneToCanvas(canvasRef.current, world, false);
        }
        scheduleNext(80);
        return;
      }

      stepWorld(world, inputRef.current, dt);
      inputRef.current.justPressed.clear();

      if (audio && world.stage !== prevStage && audio.isUnlocked()) {
        audio.setMusicTheme(getThemeForWorld('playing', world));
      }

      if (audio && audio.isUnlocked()) {
        for (const ev of world.events) {
          switch (ev.type) {
            case 'jump':
              audio.playJump();
              break;
            case 'land':
              audio.playLand();
              break;
            case 'collect':
              audio.playCollect();
              break;
            case 'interact':
              audio.playInteract();
              break;
            case 'jesus_call':
              audio.playJesusCall();
              break;
            case 'pray':
              audio.playPray();
              break;
            case 'calm_lion':
              audio.playCalmLion();
              break;
            case 'sling':
              audio.playSling();
              break;
            case 'telegraph':
              audio.playTelegraph();
              break;
            case 'hurt':
              audio.playHurt();
              break;
            case 'victory':
              audio.playVictory();
              break;
            case 'defeat':
              audio.playDefeat();
              break;
          }
        }
      }

      speakCueIfNeeded(world);

      if (canvasRef.current) {
        drawSceneToCanvas(canvasRef.current, world, isSpeakingRef.current);
      }

      if (world.outcome) {
        const runSum = buildRunSummary(world);
        setSummary(runSum);
        setProgress(saveRunProgress(runSum));
        setHud(buildHudSnapshot(world));
        setPhase('gameover');
        return;
      }

      hudAccumulator += dt;
      if (hudAccumulator >= 0.12) {
        hudAccumulator = 0;
        setHud(buildHudSnapshot(world));
      }

      const frameDurationMs = performance.now() - frameStart;
      scheduleNext(frameDurationMs > 14 ? 16 : 0);
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      if (yieldTimerId !== null) window.clearTimeout(yieldTimerId);
    };
  }, [phase, speakCueIfNeeded]);

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#1D1510]">
      {phase === 'title' ? (
        <TitleScreen
          selectedStory={selectedStory}
          progress={progress}
          viewport={viewport}
          canFullscreen={canFullscreen}
          isFullscreen={isFullscreen}
          onRequestLandscape={handleRequestLandscape}
          onSelectStory={(story) => {
            unlockAudioFromGesture();
            setSelectedStory(story);
          }}
          onStart={(story) => startStory(story, true)}
        />
      ) : (
        <div className="relative h-full w-full overflow-hidden">
          <canvas
            ref={canvasRef}
            className="touch-none block h-full w-full"
            aria-label="Escenario del videojuego Historias Bíblicas"
          />

          <GameHud
            hud={hud}
            muted={muted}
            voiceEnabled={voiceEnabled}
            isSpeaking={isSpeaking}
            speechError={speechError}
            showTouchControls={viewport.isMobileLike || viewport.isTouchDevice}
            isCompactLandscape={viewport.isCompactLandscape}
            canFullscreen={canFullscreen}
            isFullscreen={isFullscreen}
            onDismissSpeechError={() => setSpeechError(null)}
            onToggleMute={toggleMute}
            onToggleVoice={toggleVoice}
            onToggleFullscreen={handleToggleFullscreen}
            onReplayDialogue={handleReplayDialogue}
            onRestart={() => startStory(worldRef.current.story, true)}
            onPause={handlePauseToggle}
            onTouchKey={handleTouchKey}
          />

          {showRotatePrompt && (
            <RotateDeviceOverlay
              onRequestLandscape={handleRequestLandscape}
              onContinuePortrait={() => setPortraitBypassed(true)}
            />
          )}

          {(phase === 'paused' || phase === 'gameover') && (
            <StatusModal
              phase={phase}
              story={worldRef.current.story}
              summary={summary}
              onResume={handlePauseToggle}
              onRestart={() => startStory(worldRef.current.story, true)}
              onNextStory={(next) => startStory(next, true)}
              onMainMenu={handleMainMenu}
            />
          )}
        </div>
      )}

      <OfflineBanner />
    </main>
  );
}
