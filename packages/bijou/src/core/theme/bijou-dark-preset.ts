import type { Theme } from './tokens.js';
import { compileRuleAuthoredPreset } from './preset-authoring.js';
import { minContrastWith, mostVivid, scope } from './theme-rules.js';

/**
 * BIJOU_DARK — the calm first-party dark theme.
 *
 * This preset is intentionally less saturated than the legacy cyan/magenta
 * palette. It keeps neutral surfaces dominant, separates focus/brand/status
 * roles, and preserves readable foregrounds across dense product surfaces.
 */
export const BIJOU_DARK: Theme = compileRuleAuthoredPreset({
  name: 'bijou-dark',
  mode: 'dark',
  definitions: {
    ink: { primary: '#f4e8bf', secondary: '#d8def0', elevated: '#f8f0d0', muted: '#a8b1c7' },
    brand: { primary: '#7aa7e8', accent: '#f2c45d', success: '#8bd67d', error: '#ff8a80', info: '#8fbaff' },
    surfaceBase: {
      primary: '#171827',
      secondary: '#20243a',
      elevated: '#29304d',
      overlay: '#10121f',
      muted: '#131625',
    },
    borderBase: { muted: '#77809d' },
    uiBase: { trackEmpty: '#2a3150' },
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
      scrollTrack: { ref: 'borderBase.muted' },
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
