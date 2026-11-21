import type { PointerEvent } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Hand,
  Heart,
  Maximize2,
  MessageSquareText,
  Minimize2,
  Pause,
  Repeat2,
  RotateCcw,
  Star,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  voiceEnabled: boolean;
  isSpeaking: boolean;
  speechError: string | null;
  showTouchControls: boolean;
  isCompactLandscape: boolean;
  canFullscreen: boolean;
  isFullscreen: boolean;
  onDismissSpeechError: () => void;
  onReplayDialogue: () => void;
  onToggleMute: () => void;
  onToggleVoice: () => void;
  onToggleFullscreen: () => void;
  onRestart: () => void;
  onPause: () => void;
  onTouchKey: (code: string, down: boolean) => void;
}

export function GameHud({
  hud,
  muted,
  voiceEnabled,
  isSpeaking,
  speechError,
  showTouchControls,
  isCompactLandscape,
  canFullscreen,
  isFullscreen,
  onDismissSpeechError,
  onReplayDialogue,
  onToggleMute,
  onToggleVoice,
  onToggleFullscreen,
  onRestart,
  onPause,
  onTouchKey,
}: GameHudProps) {
  const plaqueClass = hud.hudDark
    ? 'border-amber-200/20 bg-stone-950/88 text-stone-100'
    : 'border-amber-900/20 bg-amber-50/92 text-stone-900';

  const mutedTextClass = hud.hudDark ? 'text-amber-300' : 'text-amber-800';
  const subTextClass = hud.hudDark ? 'text-stone-300' : 'text-stone-700';
  const btnClass = hud.hudDark
    ? 'border-amber-200/20 bg-stone-950/88 text-stone-100 hover:bg-stone-900'
    : 'border-amber-900/20 bg-amber-50/92 text-stone-900 hover:bg-amber-100';

  const progressPct = Math.min(
    100,
    Math.round((hud.stepCurrent / Math.max(1, hud.stepTotal)) * 100)
  );

  // Multi-touch safe pointer handlers with pointer capture so holding Move + tapping Jump never sticks
  const bindTouchControl = (code: string) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore if synthetic pointer event
      }
      onTouchKey(code, true);
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onTouchKey(code, false);
    },
    onPointerCancel: () => onTouchKey(code, false),
    onLostPointerCapture: () => onTouchKey(code, false),
  });

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-20 flex flex-col justify-between pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] ${
        isCompactLandscape
          ? 'pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]'
          : 'pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4'
      }`}
    >
      {/* Top Row: Objective plaque (left) + Utility buttons (right) */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div
          className={`pointer-events-auto rounded-2xl border shadow-sm ${plaqueClass} ${
            isCompactLandscape
              ? 'max-w-[56vw] px-2.5 py-1.5'
              : 'max-w-md px-3.5 py-2.5'
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-semibold sm:text-xs">
            <span className={`truncate ${mutedTextClass}`}>
              {hud.stageLabel} · {hud.verseHint}
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              {hud.starsCollected}/{hud.starsTotal}
            </span>
            <span className="tabular-nums opacity-85">{hud.elapsedSeconds}s</span>
            {hud.showHearts && (
              <span className="inline-flex items-center gap-0.5" aria-label={`Vidas: ${hud.hp}`}>
                {Array.from({ length: hud.maxHp }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < hud.hp ? 'fill-rose-500 text-rose-500' : 'text-stone-400/60'
                    }`}
                  />
                ))}
              </span>
            )}
          </div>
          <p
            className={`leading-snug ${subTextClass} ${
              isCompactLandscape
                ? 'mt-0.5 line-clamp-1 text-[11px]'
                : 'mt-1 text-xs sm:text-sm'
            }`}
          >
            {hud.objectiveText}
          </p>
          {/* Slim story progression bar */}
          <div
            className={`w-full overflow-hidden rounded-full ${
              isCompactLandscape ? 'mt-1 h-1' : 'mt-2 h-1.5'
            } ${hud.hudDark ? 'bg-stone-800' : 'bg-amber-900/15'}`}
            aria-label={`Progreso de la historia: ${hud.stepCurrent} de ${hud.stepTotal}`}
          >
            <div
              className="h-full rounded-full bg-amber-500 transition-[width] duration-300"
              style={{ width: `${Math.max(8, progressPct)}%` }}
            />
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onReplayDialogue();
            }}
            aria-label="Repetir narración"
            title="Repetir narración [H]"
            className={`whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border text-xs font-semibold transition ${btnClass} ${
              isCompactLandscape ? 'p-2' : 'px-2.5 py-2'
            }`}
          >
            <Repeat2 className="h-4 w-4 text-amber-500" />
            {!isCompactLandscape && <span className="hidden lg:inline">Repetir</span>}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleVoice();
            }}
            aria-label={voiceEnabled ? 'Desactivar voz dramatizada' : 'Activar voz dramatizada'}
            title="Voz dramatizada [V]"
            className={`whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border text-xs font-semibold transition ${btnClass} ${
              isCompactLandscape ? 'p-2' : 'px-2.5 py-2'
            }`}
          >
            <MessageSquareText
              className={`h-4 w-4 ${
                isSpeaking
                  ? 'text-amber-500'
                  : voiceEnabled
                    ? 'text-emerald-600'
                    : 'opacity-50'
              }`}
            />
            {!isCompactLandscape && (
              <span className="hidden sm:inline">{voiceEnabled ? 'Voz' : 'Sin voz'}</span>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            title="Silenciar [M]"
            className={`whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border text-xs font-semibold transition ${btnClass} ${
              isCompactLandscape ? 'p-2' : 'px-2.5 py-2'
            }`}
          >
            {muted ? <VolumeX className="h-4 w-4 text-rose-500" /> : <Volume2 className="h-4 w-4" />}
            {!isCompactLandscape && (
              <span className="hidden sm:inline">{muted ? 'Mudo' : 'Audio'}</span>
            )}
          </button>

          {canFullscreen && (showTouchControls || isCompactLandscape) && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleFullscreen();
              }}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa horizontal'}
              title="Pantalla completa horizontal"
              className={`whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border text-xs font-semibold transition ${btnClass} ${
                isCompactLandscape ? 'p-2' : 'px-2.5 py-2'
              }`}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4 text-amber-500" />
              )}
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            aria-label="Reiniciar historia"
            title="Reiniciar [R]"
            className={`whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border text-xs font-semibold transition ${btnClass} ${
              isCompactLandscape ? 'p-2' : 'px-2.5 py-2'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            {!isCompactLandscape && <span className="hidden sm:inline">Reiniciar</span>}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            aria-label="Pausar juego"
            title="Pausar [P]"
            className={`whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border text-xs font-semibold transition ${btnClass} ${
              isCompactLandscape ? 'p-2' : 'px-2.5 py-2'
            }`}
          >
            <Pause className="h-4 w-4" />
            {!isCompactLandscape && <span className="hidden sm:inline">Pausa</span>}
          </button>
        </div>
      </div>

      {/* Dismissible Speech Notice (only on error) */}
      {speechError && (
        <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-xl border border-amber-400/40 bg-stone-950/92 px-3 py-2 text-xs text-amber-100">
          <span className="flex-1">{speechError}</span>
          <button
            type="button"
            tabIndex={-1}
            onClick={onDismissSpeechError}
            aria-label="Cerrar aviso"
            className="cursor-pointer rounded p-0.5 hover:bg-stone-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Ergonomic Multi-Touch Thumb Controls (visible on all mobile phones & tablets, portrait OR landscape) */}
      {showTouchControls && (
        <div
          data-touch-controls="true"
          className="flex items-end justify-between select-none"
        >
          {/* Left Thumb Cluster: Move Left / Crouch / Move Right */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              tabIndex={-1}
              {...bindTouchControl('ArrowLeft')}
              aria-label="Mover izquierda"
              className="touch-none flex h-13 w-13 items-center justify-center rounded-2xl border border-amber-200/35 bg-stone-950/78 text-stone-100 shadow-md active:scale-95 active:bg-amber-500/30"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              {...bindTouchControl('ArrowDown')}
              aria-label="Agachar o bajar"
              className="touch-none flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/30 bg-stone-950/75 text-stone-100 shadow-md active:scale-95 active:bg-amber-500/30"
            >
              <ArrowDown className="h-5 w-5" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              {...bindTouchControl('ArrowRight')}
              aria-label="Mover derecha"
              className="touch-none flex h-13 w-13 items-center justify-center rounded-2xl border border-amber-200/35 bg-stone-950/78 text-stone-100 shadow-md active:scale-95 active:bg-amber-500/30"
            >
              <ArrowRight className="h-6 w-6" />
            </button>
          </div>

          {/* Right Thumb Cluster: Action / Sling + Jump / Climb */}
          <div className="pointer-events-auto flex items-center gap-2.5">
            <button
              type="button"
              tabIndex={-1}
              {...bindTouchControl('KeyE')}
              aria-label="Actuar o lanzar"
              className="touch-none flex h-13 items-center gap-1.5 rounded-2xl border border-amber-300/60 bg-amber-500/92 px-4 text-xs font-bold text-stone-950 shadow-md active:scale-95 active:bg-amber-400"
            >
              <Hand className="h-4 w-4" />
              Actuar
            </button>
            <button
              type="button"
              tabIndex={-1}
              {...bindTouchControl('Space')}
              aria-label="Saltar o subir"
              className="touch-none flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/40 bg-stone-950/82 text-amber-300 shadow-md active:scale-95 active:bg-amber-500/30"
            >
              <ArrowUp className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
