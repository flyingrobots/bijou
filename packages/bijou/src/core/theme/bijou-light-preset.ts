import { compileSapphirePreset } from './sapphire-preset.js';

/**
 * BIJOU_LIGHT — the calm first-party light theme.
 *
 * The light preset mirrors the dark theme's roles while using ink-forward
 * foregrounds instead of pastel text, so dense terminal surfaces remain
 * scannable on bright backgrounds.
 */
export const BIJOU_LIGHT = compileSapphirePreset('light');
