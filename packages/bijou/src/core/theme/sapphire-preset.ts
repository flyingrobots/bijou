import type { Theme } from './tokens.js';
import { compileRuleAuthoredPreset } from './preset-authoring.js';
import { createSapphireReferencePalette } from './sapphire-palette.js';
import { minContrastWith, mostVivid, scope } from './theme-rules.js';

/** Compile one mode of the shared Sapphire Noir first-party theme system. */
export function compileSapphirePreset(mode: 'dark' | 'light'): Theme {
  const palette = createSapphireReferencePalette(mode);
  return compileRuleAuthoredPreset({
    name: `bijou-${mode}`,
    mode,
    definitions: {
      ink: palette.ink,
      brand: palette.brand,
      surfaceBase: palette.surfaceBase,
      borderBase: palette.borderBase,
      uiBase: palette.uiBase,
      decision: {
        primaryText: minContrastWith({ ref: 'surface.primary.bg' }, scope('ink'), { ratio: 4.5 }),
      },
      status: {
        success: { ref: 'brand.success' },
        error: { ref: 'brand.error' },
        warning: { ref: 'brand.warning' },
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
          not: ['brand.success', 'brand.warning', 'brand.error', 'brand.info'],
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
        focusGutter: {
          fg: { ref: 'semantic.accent' },
          bg: { ref: 'surface.primary.bg' },
          modifiers: ['bold'],
        },
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
      progress: [
        { ref: 'brand.primary' },
        { ref: 'brand.success' },
        { ref: 'semantic.accent' },
        { ref: 'brand.error' },
      ],
    },
  });
}
