import { useSyncExternalStore } from 'react';
import { GALLERY_DEMOS, type GalleryDemo } from './demos.js';

/** What the address says: the gallery (with the unknown id it was asked for, if any) or one demo. */
export type GalleryRoute =
  | { readonly kind: 'gallery'; readonly unknown: string | null }
  | { readonly kind: 'demo'; readonly demo: GalleryDemo };

export function parseRoute(search: string, demos: readonly GalleryDemo[] = GALLERY_DEMOS): GalleryRoute {
  const id = new URLSearchParams(search).get('app');
  if (id === null || id === '') return { kind: 'gallery', unknown: null };
  const demo = demos.find((entry) => entry.id === id);
  return demo === undefined ? { kind: 'gallery', unknown: id } : { kind: 'demo', demo };
}

/** The address of a demo, or of the gallery for `null`; only the backend choice carries over. */
export function routeHref(id: string | null, search: string): string {
  const next = new URLSearchParams();
  if (id !== null) next.set('app', id);
  const backend = new URLSearchParams(search).get('backend');
  if (backend !== null) next.set('backend', backend);
  return `?${next.toString()}`;
}

/** Ids the gallery once had and has no longer. Their addresses open the gallery, so an old link still works. */
const RETIRED: readonly string[] = ['fun'];

/** The gallery's address when `search` names a retired entry, with the backend choice kept; otherwise null. */
export function retiredHref(search: string): string | null {
  const id = new URLSearchParams(search).get('app');
  return id !== null && RETIRED.includes(id) ? routeHref(null, search) : null;
}

const listeners = new Set<() => void>();

/** Go to an address of this page, keeping the history, so the back and forward buttons walk the visits. */
export function navigate(href: string): void {
  window.history.pushState(null, '', href);
  for (const listener of listeners) listener();
}

/** Put `href` in place of the current address, adding no visit: the back button skips the address it replaced. */
export function redirect(href: string): void {
  window.history.replaceState(null, '', href);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

/** The address's query, which changes with a visit and with the back and forward buttons. */
export function useSearch(): string {
  return useSyncExternalStore(subscribe, () => window.location.search);
}
