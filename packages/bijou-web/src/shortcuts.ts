/** Platform family that decides which browser shortcuts pass through. */
export type WebPlatform = 'mac' | 'other';

/** A key chord, as a pass-through predicate sees it. */
export interface WebShortcutEvent {
  /** The DOM `key` value. */
  readonly key: string;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly shift: boolean;
  readonly meta: boolean;
}

/** Returns `true` when the browser should handle the chord and the application should not. */
export type WebPassThrough = (event: WebShortcutEvent) => boolean;

const MAC_BROWSER_KEYS = 'rwtlcv';
const MAC_DEVTOOLS_KEYS = 'ijuc';
const OTHER_PLAIN_KEYS = 'tnv';
const OTHER_SHIFTED_KEYS = 'ijcvtnw';

/**
 * Build the default pass-through policy.
 *
 * macOS passes Meta+R/W/T/L/C/V and the Meta+Alt DevTools chords. Other
 * platforms pass F12, Ctrl+Shift+I/J/C, Ctrl+T/N/V and Ctrl+Shift+V/T/N/W,
 * which a page cannot intercept or which paste. Ctrl+R, Ctrl+L, and Ctrl+W
 * reach the application, because a page can intercept them there. F12 passes
 * everywhere.
 */
export function createPassThrough(platform: WebPlatform): WebPassThrough {
  return (event) => {
    if (event.key === 'F12') return true;
    const key = event.key.length === 1 ? event.key.toLowerCase() : '';
    if (key === '') return false;
    if (platform === 'mac') {
      if (!event.meta || event.ctrl) return false;
      return event.alt ? MAC_DEVTOOLS_KEYS.includes(key) : MAC_BROWSER_KEYS.includes(key);
    }
    if (!event.ctrl || event.alt || event.meta) return false;
    return (event.shift ? OTHER_SHIFTED_KEYS : OTHER_PLAIN_KEYS).includes(key);
  };
}
