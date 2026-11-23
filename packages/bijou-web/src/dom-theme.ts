import type { BijouContext, Theme } from '@flyingrobots/bijou';
import type { BijouDomElement } from './dom-contract.js';

const SEMANTIC = ['success', 'error', 'warning', 'info', 'accent', 'muted', 'primary'] as const satisfies readonly (keyof Theme['semantic'])[];
const SURFACE = ['primary', 'secondary', 'elevated', 'overlay', 'muted'] as const satisfies readonly (keyof Theme['surface'])[];
const BORDER = ['primary', 'secondary', 'success', 'warning', 'error', 'muted'] as const satisfies readonly (keyof Theme['border'])[];

/** Each custom property name and the hex color the context gives it now. */
export function themeCustomProperties(ctx: BijouContext): readonly (readonly [string, string])[] {
  return [
    ...SEMANTIC.map((key) => [`--bijou-semantic-${key}`, ctx.semantic(key).hex] as const),
    ...SURFACE.map((key) => [`--bijou-surface-${key}`, ctx.surface(key).hex] as const),
    ...BORDER.map((key) => [`--bijou-border-${key}`, ctx.border(key).hex] as const),
  ];
}

/**
 * Write the context's semantic, surface, and border tokens to `element` as
 * custom properties. Each call writes only the properties whose color changed
 * since the last call.
 */
export function createThemeSync(ctx: BijouContext, element: BijouDomElement): () => void {
  const written = new Map<string, string>();
  return () => {
    for (const [name, value] of themeCustomProperties(ctx)) {
      if (written.get(name) === value) continue;
      element.style.setProperty(name, value);
      written.set(name, value);
    }
  };
}
