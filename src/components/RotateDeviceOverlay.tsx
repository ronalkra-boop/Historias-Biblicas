import { Maximize2, RotateCw } from 'lucide-react';

interface RotateDeviceOverlayProps {
  onRequestLandscape: () => void;
  onContinuePortrait: () => void;
}

export function RotateDeviceOverlay({
  onRequestLandscape,
  onContinuePortrait,
}: RotateDeviceOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotate-overlay-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1D1510]/96 px-6 text-center text-stone-100"
    >
      <div className="flex max-w-sm flex-col items-center rounded-3xl border border-amber-300/25 bg-stone-900/95 p-6 shadow-2xl">
        {/* Animated phone icon rotating from portrait to landscape */}
        <div className="relative mb-5 flex h-20 w-24 items-center justify-center">
          <div className="rotate-phone-anim flex h-16 w-10 items-center justify-center rounded-xl border-2 border-amber-400 bg-stone-950 shadow-inner">
            <div className="h-10 w-6 rounded-sm bg-amber-400/20" />
          </div>
          <RotateCw className="absolute -right-1 -bottom-1 h-6 w-6 text-amber-400" />
        </div>

        <h2
          id="rotate-overlay-title"
          className="text-2xl font-bold text-amber-50"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Gira tu celular en horizontal
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-300">
          Historias Bíblicas está diseñado en formato panorámico para ver todo el escenario y usar los controles cómodamente con ambos pulgares.
        </p>

        <button
          type="button"
          onClick={onRequestLandscape}
          className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-950 transition hover:bg-amber-400 active:scale-[0.98]"
        >
          <Maximize2 className="h-4 w-4" />
          Activar modo horizontal
        </button>

        <button
          type="button"
          onClick={onContinuePortrait}
          className="mt-3 cursor-pointer text-xs font-medium text-stone-400 underline underline-offset-4 transition hover:text-stone-200"
        >
          Continuar en vertical de todos modos
        </button>
      </div>
    </div>
  );
}
