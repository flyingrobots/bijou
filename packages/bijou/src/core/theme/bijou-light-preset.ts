import type { Theme } from './tokens.js';
import { compileRuleAuthoredPreset } from './preset-authoring.js';
import { minContrastWith, mostVivid, scope } from './theme-rules.js';

/**
 * BIJOU_LIGHT — the calm first-party light theme.
 *
 * The light preset mirrors the dark theme's roles while using ink-forward
 * foregrounds instead of pastel text, so dense terminal surfaces remain
 * scannable on bright backgrounds.
 */
export const BIJOU_LIGHT: Theme = compileRuleAuthoredPreset({
  name: 'bijou-light',
  mode: 'light',
  definitions: {
    ink: { primary: '#1e2433', secondary: '#252b38', elevated: '#1e2433', muted: '#5e6778' },
    brand: { primary: '#285c9e', accent: '#7a5200', success: '#246a3d', error: '#a33a3a', info: '#285c9e' },
    surfaceBase: {
      primary: '#fbf7ea',
      secondary: '#efe7d2',
      elevated: '#fffdf6',
      overlay: '#f5eddb',
      muted: '#ece4d1',
    },
    borderBase: {
      muted: '#6f7888',
      scrollTrack: '#718399',
    },
    uiBase: { trackEmpty: '#ded6c3' },
    decision: {
      primaryText: minContrastWith({ ref: 'surface.primary.bg' }, scope('ink'), { ratio: 4.5 }),
    },
    status: {
      success: { ref: 'brand.success' },
      error: { ref: 'brand.error' },
      warning: { ref: 'brand.accent' },
      info: { ref: 'brand.info' },
      pending: { fg: { ref: 'ink.muted' }, modifiers: ['dim'] },
      active: { ref: 'semantic.accent' },
      muted: { fg: { ref: 'ink.muted' }, modifiers: ['dim', 'strikethrough'] },
    },
    semantic: {
      success: { ref: 'status.success' },
      error: { ref: 'status.error' },
      warning: { ref: 'status.warning' },
      info: { ref: 'status.info' },
      accent: mostVivid(scope('brand'), {
        against: { ref: 'surface.primary.bg' },
        minContrast: 4.5,
        not: ['brand.success', 'brand.error'],
      }),
      muted: { fg: { ref: 'ink.muted' }, modifiers: ['dim'] },
      primary: { fg: { ref: 'decision.primaryText' }, modifiers: ['bold'] },
    },
    border: {
      primary: { ref: 'brand.primary' },
      secondary: { ref: 'semantic.accent' },
      success: { ref: 'semantic.success' },
      warning: { ref: 'semantic.warning' },
      error: { ref: 'semantic.error' },
      muted: { ref: 'borderBase.muted' },
    },
    ui: {
      cursor: { ref: 'semantic.accent' },
      focusGutter: { fg: { ref: 'semantic.accent' }, bg: { ref: 'surface.primary.bg' }, modifiers: ['bold'] },
      scrollThumb: { ref: 'brand.primary' },
      scrollTrack: { ref: 'borderBase.scrollTrack' },
      sectionHeader: { fg: { ref: 'semantic.accent' }, modifiers: ['bold'] },
      logo: { ref: 'semantic.accent' },
      tableHeader: { fg: { ref: 'decision.primaryText' }, modifiers: ['bold'] },
      trackEmpty: { ref: 'uiBase.trackEmpty' },
    },
    surface: {
      primary: { fg: { ref: 'decision.primaryText' }, bg: { ref: 'surfaceBase.primary' } },
      secondary: { fg: { ref: 'ink.secondary' }, bg: { ref: 'surfaceBase.secondary' } },
      elevated: { fg: { ref: 'ink.elevated' }, bg: { ref: 'surfaceBase.elevated' } },
      overlay: { fg: { ref: 'ink.elevated' }, bg: { ref: 'surfaceBase.overlay' } },
      muted: { fg: { ref: 'ink.muted' }, bg: { ref: 'surfaceBase.muted' } },
    },
  },
  gradient: {
    brand: [{ ref: 'brand.primary' }, { ref: 'semantic.accent' }, { ref: 'brand.error' }],
    progress: [{ ref: 'brand.primary' }, { ref: 'brand.success' }, { ref: 'semantic.accent' }, { ref: 'brand.error' }],
  },
});
