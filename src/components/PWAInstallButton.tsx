import { useState } from 'react';
import { Check, Copy, Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  // Hide once the app is already running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(false);
      }
      return;
    }
    setShowGuide(true);
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = window.location.origin;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard may be restricted in some preview contexts
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        aria-label="Instalar aplicación en tu celular"
        className="whitespace-nowrap shrink-0 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-400/45 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100 shadow-sm transition hover:bg-amber-500/30 active:scale-[0.98]"
      >
        <Download className="h-3.5 w-3.5 text-amber-300" />
        Instalar App
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-xs"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-amber-300/25 bg-[#231914] p-5 text-stone-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-300">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <h3
                    id="pwa-install-guide-title"
                    className="text-lg font-bold text-amber-50"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Instalar en tu celular
                  </h3>
                  <p className="text-xs text-stone-300">
                    Juega en pantalla completa horizontal desde tu inicio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Cerrar instrucciones de instalación"
                className="cursor-pointer rounded-lg p-1 text-stone-300 transition hover:bg-stone-800 hover:text-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 rounded-xl border border-amber-200/15 bg-stone-950/60 p-3.5 text-sm text-stone-200">
                <li>
                  1. Toca el botón <strong className="text-amber-300">Compartir</strong> en la barra inferior de Safari.
                </li>
                <li>
                  2. Desliza y elige <strong className="text-amber-300">Agregar a inicio</strong>.
                </li>
                <li>
                  3. Abre el icono y gira el teléfono en horizontal para jugar.
                </li>
              </ol>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-stone-200">
                {isInIframe && (
                  <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    Estás viendo la vista previa integrada. Para descargarla en tu celular, abre el enlace compartido directamente en <strong>Chrome</strong> o <strong>Safari</strong>.
                  </p>
                )}

                <div className="rounded-xl border border-amber-200/15 bg-stone-950/60 p-3.5">
                  <div className="text-xs font-bold uppercase tracking-wide text-amber-300">
                    Android (Google Chrome)
                  </div>
                  <ol className="mt-1.5 space-y-1 text-xs leading-relaxed text-stone-200">
                    <li>1. Abre el enlace de la app en Chrome en tu celular.</li>
                    <li>
                      2. Toca el botón <strong>Instalar App</strong> o el menú{' '}
                      <strong className="text-amber-200">⋮ → Instalar aplicación</strong>.
                    </li>
                  </ol>
                </div>

                <div className="rounded-xl border border-amber-200/15 bg-stone-950/60 p-3.5">
                  <div className="text-xs font-bold uppercase tracking-wide text-amber-300">
                    iPhone / iPad (Safari)
                  </div>
                  <ol className="mt-1.5 space-y-1 text-xs leading-relaxed text-stone-200">
                    <li>
                      1. Toca <strong>Compartir</strong> en la barra de Safari.
                    </li>
                    <li>
                      2. Elige <strong className="text-amber-200">Agregar a inicio</strong>.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              {!isIOS && (
                <button
                  type="button"
                  onClick={() => void handleCopyLink()}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-300/30 bg-stone-900 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-stone-800"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ¡Enlace copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-amber-400" />
                      Copiar enlace
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="flex-1 cursor-pointer rounded-xl bg-amber-500 py-2 text-xs font-bold text-stone-950 transition hover:bg-amber-400"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
