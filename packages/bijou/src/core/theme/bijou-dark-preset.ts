import { compileSapphirePreset } from './sapphire-preset.js';

/**
 * BIJOU_DARK — the calm first-party dark theme.
 *
 * This preset is intentionally less saturated than the legacy cyan/magenta
 * palette. It keeps neutral surfaces dominant, separates focus/brand/status
 * roles, and preserves readable foregrounds across dense product surfaces.
 */
export const BIJOU_DARK = compileSapphirePreset('dark');
