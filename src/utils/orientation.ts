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

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

export function canUseFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  // Avoid triggering buggy Chromium/EMUI fullscreen black-screen inside already-standalone PWAs
  if (isStandaloneDisplayMode()) return false;
  const target = (document.getElementById('root') || document.body) as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  return Boolean(target && (target.requestFullscreen || target.webkitRequestFullscreen));
}

/**
 * Safely attempts to lock screen orientation to landscape without forcing
 * documentElement.requestFullscreen (which can render a black screen on older EMUI/Android 9 devices).
 */
export async function tryLockLandscapeOrientation(): Promise<boolean> {
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
      return true;
    }
  } catch {
    // Orientation lock is only supported in standalone PWA or fullscreen contexts; ignore cleanly.
  }
  return false;
}

/**
 * Attempts to enter immersive fullscreen (targeting #root, never <html>) and lock to landscape.
 * Must be triggered by an explicit user tap, never forced automatically inside standalone PWAs.
 */
export async function requestLandscapeFullscreen(): Promise<{
  fullscreen: boolean;
  locked: boolean;
}> {
  let fullscreen = isFullscreenActive();

  // If already running as an installed standalone PWA, only lock orientation without requestFullscreen
  if (isStandaloneDisplayMode()) {
    const locked = await tryLockLandscapeOrientation();
    return { fullscreen, locked };
  }

  try {
    if (!fullscreen && typeof document !== 'undefined') {
      const target = (document.getElementById('root') || document.body) as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      if (target && typeof target.requestFullscreen === 'function') {
        await target.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
        fullscreen = true;
      } else if (target && typeof target.webkitRequestFullscreen === 'function') {
        await target.webkitRequestFullscreen();
        fullscreen = true;
      }
    }
  } catch {
    // Fullscreen can be blocked in iframes or unsupported mobile Safari; continue cleanly.
  }

  const locked = await tryLockLandscapeOrientation();
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
