import { useShortcut } from '@ui-sdk/react/shortcuts';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

/**
 * The focus rule. While focus is inside a Bijou mount (`[data-bijou-mount]`:
 * the Surface's hidden textarea, or an element `mountBijouDom()` made), every
 * key belongs to the mounted app and the page's keys do nothing: no handler
 * here acts on, prevents or stops such an event. The page's keys act only
 * while focus is in the chrome, and not while a dialog or menu is open.
 */
export function focusInChrome(): boolean {
  const active = document.activeElement;
  return !(active instanceof Element && active.closest('[data-bijou-mount]') !== null);
}

const overlayOpen = (): boolean => document.querySelector('[role=dialog][data-state=open], [role=menu][data-state=open]') !== null;
export const pageKeysApply = (): boolean => focusInChrome() && !overlayOpen();

function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
    || (target instanceof HTMLInputElement && !/^(?:button|checkbox|radio|submit|reset|range|color|file|image)$/u.test(target.type));
}

/** A feature that `Space` then `key` opens. */
export interface LeaderKey {
  readonly key: string;
  readonly label: string;
  readonly run: () => void;
}

const LEADER_TIMEOUT_MS = 1500;
const visible = (element: HTMLElement): boolean => element.getClientRects().length > 0;
const navItems = (root: ParentNode): HTMLElement[] => [...root.querySelectorAll<HTMLElement>('[data-nav]')].filter(visible);

/** `j` and `k` (and the arrows) move through the controls; `h` and `l` jump to the previous or next region. */
function moveFocus(step: 1 | -1, byRegion: boolean): void {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement.closest<HTMLElement>('[data-nav]') : null;
  if (byRegion) {
    const regions = [...document.querySelectorAll<HTMLElement>('[data-nav-region]')].filter((region) => navItems(region).length > 0);
    const at = regions.findIndex((region) => active !== null && region.contains(active));
    const next = regions[at === -1 ? 0 : Math.min(Math.max(at + step, 0), regions.length - 1)];
    navItems(next ?? document)[0]?.focus();
    return;
  }
  const items = navItems(document);
  const at = active === null ? -1 : items.indexOf(active);
  items[at === -1 ? 0 : Math.min(Math.max(at + step, 0), items.length - 1)]?.focus();
}

/** The page's keys: `Esc` opens the palette, `h j k l` and the arrows move focus, `Space` then a key opens a feature. */
export function usePageKeys(openPalette: () => void, leaders: readonly LeaderKey[]): { readonly leader: boolean } {
  const [leader, setLeader] = useState(false);
  const armed = useRef<number | null>(null);
  const nav = { when: pageKeysApply, repeat: true };
  useShortcut('escape', openPalette, { when: pageKeysApply, description: 'Open the command palette' });
  for (const [keys, step, byRegion] of [['j', 1, false], ['arrowdown', 1, false], ['k', -1, false], ['arrowup', -1, false],
    ['l', 1, true], ['arrowright', 1, true], ['h', -1, true], ['arrowleft', -1, true]] as const) {
    // A fixed list, so the hooks run in the same order on every render.
    useShortcut(keys, () => { moveFocus(step, byRegion); }, { ...nav, description: 'Move focus' });
  }
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    const disarm = (): void => {
      if (armed.current !== null) window.clearTimeout(armed.current);
      armed.current = null;
      setLeader(false);
    };
    if (!pageKeysApply() || typing(event.target) || event.isComposing || event.metaKey || event.ctrlKey || event.altKey) {
      disarm();
      return;
    }
    // A held key repeats: a repeat is not a second press, so it neither arms the leader nor completes it.
    if (event.repeat) {
      if (armed.current === null || event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (armed.current === null) {
      if (event.key !== ' ' || event.shiftKey) return;
      armed.current = window.setTimeout(disarm, LEADER_TIMEOUT_MS);
      setLeader(true);
    } else {
      disarm();
      const run = event.key === ' ' ? openPalette : leaders.find((entry) => entry.key === event.key)?.run;
      if (run === undefined) return;
      run();
    }
    // Space is the leader even on a focused button, so the press is taken before the button sees it.
    event.preventDefault();
    event.stopPropagation();
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent): void => { onKey(event); };
    window.addEventListener('keydown', listener, { capture: true });
    return () => { window.removeEventListener('keydown', listener, { capture: true }); };
  }, []);
  return { leader };
}
