import { useState } from 'react';
import { CheckCircle2, Maximize2, Play, Star } from 'lucide-react';
import { STORY_CATALOG } from '../game/catalog';
import type { StoryId, StoryProgress, Testament } from '../game/types';
import type { ViewportLayoutState } from '../utils/orientation';
import { PWAInstallButton } from './PWAInstallButton';
import { StoryArtwork, TitleBackdropSvg, TitleEmblemSvg } from './StoryArtwork';

interface TitleScreenProps {
  selectedStory: StoryId;
  progress: StoryProgress;
  viewport: ViewportLayoutState;
  canFullscreen: boolean;
  isFullscreen: boolean;
  onRequestLandscape: () => void;
  onSelectStory: (story: StoryId) => void;
  onStart: (story: StoryId) => void;
}

type FilterTab = 'todas' | Testament;

export function TitleScreen({
  selectedStory,
  progress,
  viewport,
  canFullscreen,
  isFullscreen,
  onRequestLandscape,
  onSelectStory,
  onStart,
}: TitleScreenProps) {
  const [tab, setTab] = useState<FilterTab>('todas');

  const visibleStories = STORY_CATALOG.filter((item) =>
    tab === 'todas' ? true : item.testament === tab
  );

  const completedCount = STORY_CATALOG.filter(
    (s) => progress.completedStories[s.id]
  ).length;

  const compact = viewport.isCompactLandscape;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#1D1510] text-stone-100">
      {/* Full-bleed storybook backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-75">
        <TitleBackdropSvg />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/75 via-stone-950/55 to-stone-950/90" />
      </div>

      <div
        className={`relative z-10 mx-auto flex h-full w-full max-w-6xl flex-1 flex-col overflow-hidden pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] ${
          compact
            ? 'gap-1.5 pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.4rem,env(safe-area-inset-bottom))]'
            : 'gap-3 py-4 sm:px-6 sm:py-5'
        }`}
      >
        {/* Pinned Header + Testament Tabs + Install Action */}
        <header
          className={`shrink-0 flex flex-col ${
            compact
              ? 'flex-row items-center justify-between gap-2'
              : 'gap-2.5 sm:flex-row sm:items-end sm:justify-between'
          }`}
        >
          <div className="flex items-center gap-2 sm:items-start sm:gap-3">
            <div className={compact ? 'scale-90 origin-left' : ''}>
              <TitleEmblemSvg />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-amber-300 sm:text-xs">
                Aventura Bíblica 2D · {completedCount}/10 Completadas
              </div>
              <h1
                className={`font-bold tracking-tight text-amber-50 ${
                  compact ? 'text-lg leading-tight' : 'mt-0.5 text-2xl sm:text-4xl'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Historias Bíblicas
              </h1>
              {!compact && (
                <p className="mt-0.5 text-xs text-stone-200/90 sm:text-sm">
                  Toca cualquier historia del Antiguo o Nuevo Testamento para empezar a jugar.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-start sm:gap-2 sm:self-auto">
            <PWAInstallButton />

            {viewport.isMobileLike && viewport.isPortrait && canFullscreen && !isFullscreen && (
              <button
                type="button"
                onClick={onRequestLandscape}
                className="whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-300/30 bg-stone-950/85 px-2.5 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-stone-900"
              >
                <Maximize2 className="h-3.5 w-3.5 text-amber-400" />
                Horizontal
              </button>
            )}

            <div
              className="flex items-center gap-1 rounded-xl border border-amber-200/20 bg-stone-950/85 p-1"
              role="tablist"
              aria-label="Filtrar por Testamento"
            >
              {(
                [
                  { id: 'todas', label: 'Todas · 10' },
                  { id: 'nuevo', label: 'Nuevo · 5' },
                  { id: 'antiguo', label: 'Antiguo · 5' },
                ] as const
              ).map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.id)}
                    className={`whitespace-nowrap shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold transition sm:px-3 sm:py-1.5 ${
                      active
                        ? 'bg-amber-500 text-stone-950'
                        : 'text-stone-200 hover:bg-stone-800'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Scrollable Story Grid so Header & Play Footer stay visible on every phone screen */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          <div
            className={`grid ${
              compact
                ? 'grid-cols-3 gap-1.5 md:grid-cols-5'
                : 'grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3'
            }`}
          >
            {visibleStories.map((item) => {
              const selected = item.id === selectedStory;
              const done = progress.completedStories[item.id];
              const stars = progress.bestStars[item.id] ?? 0;
              const bestTime = progress.bestTimeSeconds[item.id];

              return (
                <button
                  key={item.id}
                  type="button"
                  onFocus={() => onSelectStory(item.id)}
                  onMouseEnter={() => onSelectStory(item.id)}
                  onClick={() => onStart(item.id)}
                  className={`group flex cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition sm:rounded-2xl ${
                    selected
                      ? 'border-amber-400 bg-stone-900/95 ring-2 ring-amber-400/50'
                      : 'border-amber-100/20 bg-stone-900/85 hover:border-amber-300/60 hover:bg-stone-900/95'
                  }`}
                >
                  <div
                    className={`relative w-full overflow-hidden border-b border-stone-800 ${
                      compact ? 'h-11' : 'h-20 sm:h-24'
                    }`}
                  >
                    <StoryArtwork story={item.id} />
                    {done && (
                      <span className="absolute top-1 right-1 inline-flex items-center gap-1 rounded-md bg-emerald-950/90 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Lista
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex flex-1 flex-col justify-between ${
                      compact ? 'p-1.5' : 'p-2.5 sm:p-3'
                    }`}
                  >
                    <div>
                      <div className="truncate text-[10px] font-medium text-amber-300 sm:text-[11px]">
                        {item.testament === 'nuevo' ? 'Nuevo' : 'Antiguo'} · {item.reference}
                      </div>
                      <h2
                        className={`mt-0.5 leading-tight font-bold text-amber-50 ${
                          compact ? 'truncate text-xs' : 'text-sm leading-snug sm:text-base'
                        }`}
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {item.title}
                      </h2>
                      {!compact && (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-stone-300 sm:text-xs">
                          {item.summary}
                        </p>
                      )}
                    </div>

                    <div
                      className={`flex items-center justify-between border-t border-stone-800 text-[10px] text-stone-300 sm:text-[11px] ${
                        compact ? 'mt-1 pt-1' : 'mt-2 pt-1.5'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Star
                          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                            stars > 0 ? 'fill-amber-400 text-amber-400' : 'text-stone-500'
                          }`}
                        />
                        {stars}/3
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                        {bestTime !== null ? `${bestTime}s` : 'Jugar'}
                        <Play className="h-2.5 w-2.5 fill-current" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pinned Action Footer */}
        <footer
          className={`shrink-0 flex items-center justify-between rounded-xl border border-amber-200/20 bg-stone-950/90 sm:rounded-2xl ${
            compact
              ? 'flex-row gap-2 px-3 py-1.5'
              : 'flex-row gap-2 px-3 py-2 sm:px-4 sm:py-3'
          }`}
        >
          <div className="truncate text-left text-[11px] text-stone-300 sm:text-xs">
            {viewport.isMobileLike ? (
              <>
                <span className="font-semibold text-amber-300">Toca una historia para jugar</span>{' '}
                · Controles táctiles en pantalla
              </>
            ) : (
              <>
                <span className="font-semibold text-amber-300">Controles:</span>{' '}
                Mover <span className="text-stone-100">A/D o Flechas</span> · Saltar/Trepar{' '}
                <span className="text-stone-100">Espacio o W</span> · Agachar{' '}
                <span className="text-stone-100">S/↓</span> · Actuar/Honda{' '}
                <span className="text-stone-100">E</span>
              </>
            )}
          </div>

          <button
            type="button"
            data-start="true"
            onClick={() => onStart(selectedStory)}
            className={`whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-amber-500 font-bold text-stone-950 transition hover:bg-amber-400 active:scale-[0.98] ${
              compact ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm'
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" />
            Jugar Historia
          </button>
        </footer>
      </div>
    </div>
  );
}
