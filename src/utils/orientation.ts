export interface ViewportLayoutState {
  width: number;
  height: number;
  isPortrait: boolean;
  isTouchDevice: boolean;
  isCompactLandscape: boolean;
  isMobileLike: boolean;
}

export function computeViewportLayout(
  width: number,
  height: number,
  hasCoarsePointer: boolean,
  maxTouchPoints: number
): ViewportLayoutState {
  const isPortrait = height > width;
  const shortest = Math.min(width, height);
  const longest = Math.max(width, height);
  const isTouchDevice = hasCoarsePointer || maxTouchPoints > 0;
  // Treat touch phones/small tablets (or narrow mobile-emulated viewports) as mobile-like
  const isMobileLike =
    (isTouchDevice && shortest <= 900) || (shortest <= 540 && longest <= 1024);
  const isCompactLandscape = !isPortrait && height <= 520;

  return {
    width,
    height,
    isPortrait,
    isTouchDevice,
    isCompactLandscape,
    isMobileLike,
  };
}

export function readCurrentViewportLayout(): ViewportLayoutState {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 720,
      isPortrait: false,
      isTouchDevice: false,
      isCompactLandscape: false,
      isMobileLike: false,
    };
  }
  const hasCoarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const maxTouch = typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0;
  return computeViewportLayout(window.innerWidth, window.innerHeight, hasCoarse, maxTouch);
}

export function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

export function canUseFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  return Boolean(el.requestFullscreen || el.webkitRequestFullscreen);
}

/**
 * Attempts to enter immersive fullscreen and lock the device screen to horizontal (landscape).
 * Must be called inside a user gesture handler (tap/click) for Android Chrome & WebView support.
 * Gracefully ignores unsupported browsers (e.g., iOS Safari or desktop browsers without lock).
 */
export async function requestLandscapeFullscreen(): Promise<{
  fullscreen: boolean;
  locked: boolean;
}> {
  let fullscreen = isFullscreenActive();
  let locked = false;

  try {
    if (!fullscreen && typeof document !== 'undefined') {
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      if (typeof el.requestFullscreen === 'function') {
        await el.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
        fullscreen = true;
      } else if (typeof el.webkitRequestFullscreen === 'function') {
        await el.webkitRequestFullscreen();
        fullscreen = true;
      }
    }
  } catch {
    // Fullscreen can be blocked in iframes or unsupported mobile Safari; continue cleanly.
  }

  try {
    const orientation = (
      screen as Screen & {
        orientation?: {
          lock?: (mode: string) => Promise<void>;
        };
      }
    ).orientation;
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('landscape');
      locked = true;
    }
  } catch {
    // Orientation lock is only supported on Android/Chrome fullscreen or installed PWA/TWA.
  }

  return { fullscreen, locked };
}

export async function exitLandscapeFullscreen(): Promise<void> {
  try {
    const orientation = (
      screen as Screen & {
        orientation?: {
          unlock?: () => void;
        };
      }
    ).orientation;
    orientation?.unlock?.();
  } catch {
    // ignore
  }

  try {
    if (isFullscreenActive() && typeof document.exitFullscreen === 'function') {
      await document.exitFullscreen();
    }
  } catch {
    // ignore
  }
}
