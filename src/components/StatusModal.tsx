import { ArrowRight, Home, Play, RotateCcw, Trophy } from 'lucide-react';
import { getNextStoryId, getStoryMeta } from '../game/catalog';
import type { GamePhase, RunSummary, StoryId } from '../game/types';

interface StatusModalProps {
  phase: Extract<GamePhase, 'paused' | 'gameover'>;
  story: StoryId;
  summary: RunSummary | null;
  onResume: () => void;
  onRestart: () => void;
  onNextStory: (nextStory: StoryId) => void;
  onMainMenu: () => void;
}

export function StatusModal({
  phase,
  story,
  summary,
  onResume,
  onRestart,
  onNextStory,
  onMainMenu,
}: StatusModalProps) {
  const meta = getStoryMeta(story);
  const nextStoryId = getNextStoryId(story);
  const nextMeta = getStoryMeta(nextStoryId);
  const isVictory = phase === 'gameover' && summary?.outcome === 'victory';
  const isDefeat = phase === 'gameover' && summary?.outcome === 'defeat';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/70 p-3 sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-amber-200/25 bg-[#1D1510] p-4 text-stone-100 shadow-2xl sm:p-6">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-300 uppercase">
          {isVictory && <Trophy className="h-4 w-4 text-amber-400" />}
          <span>
            {phase === 'paused'
              ? 'Juego en Pausa'
              : isVictory
                ? 'Historia Completada'
                : 'Inténtalo de Nuevo'}
          </span>
          <span>·</span>
          <span>{meta.reference}</span>
        </div>

        <h2
          className="mt-1.5 text-2xl font-bold text-amber-50 sm:text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {meta.title}
        </h2>

        {summary && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-stone-800 bg-stone-900/90 p-3">
                <div className="text-[11px] text-stone-400">Tiempo</div>
                <div className="mt-0.5 text-lg font-bold text-amber-300 tabular-nums">
                  {summary.clearTimeSeconds}s
                </div>
              </div>
              <div className="rounded-2xl border border-stone-800 bg-stone-900/90 p-3">
                <div className="text-[11px] text-stone-400">Estrellas</div>
                <div className="mt-0.5 text-lg font-bold text-amber-300 tabular-nums">
                  {summary.starsCollected}/{summary.starsTotal}
                </div>
              </div>
              <div className="rounded-2xl border border-stone-800 bg-stone-900/90 p-3">
                <div className="text-[11px] text-stone-400">{summary.primaryMetricLabel}</div>
                <div className="mt-0.5 text-lg font-bold text-amber-300 tabular-nums">
                  {summary.primaryMetricValue}
                </div>
              </div>
            </div>

            <blockquote className="mt-4 rounded-2xl border border-amber-200/15 bg-stone-900/75 p-4 text-sm leading-relaxed text-stone-200">
              <p className="italic">{summary.verseText}</p>
              <footer className="mt-1.5 text-xs font-semibold text-amber-300">
                — {summary.verseRef}
              </footer>
            </blockquote>
          </>
        )}

        {phase === 'paused' && (
          <p className="mt-3 text-sm text-stone-300">{meta.summary}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onMainMenu}
            className="whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-900 px-3.5 py-2.5 text-xs font-semibold text-stone-200 transition hover:bg-stone-800"
          >
            <Home className="h-4 w-4" />
            Menú Principal
          </button>

          <button
            type="button"
            data-start={isDefeat ? 'true' : undefined}
            onClick={onRestart}
            className="whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-400/35 bg-stone-900 px-3.5 py-2.5 text-xs font-semibold text-amber-200 transition hover:bg-stone-800"
          >
            <RotateCcw className="h-4 w-4" />
            Volver a Jugar
          </button>

          {phase === 'paused' && (
            <button
              type="button"
              onClick={onResume}
              className="whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition hover:bg-amber-400"
            >
              <Play className="h-4 w-4 fill-current" />
              Continuar
            </button>
          )}

          {isVictory && (
            <button
              type="button"
              onClick={() => onNextStory(nextStoryId)}
              className="whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition hover:bg-amber-400"
            >
              Siguiente: {nextMeta.title}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
