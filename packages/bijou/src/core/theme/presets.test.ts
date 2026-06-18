import { describe, it, expect } from 'vitest';
import { BIJOU_DARK, BIJOU_LIGHT, PRESETS, CYAN_MAGENTA, TEAL_ORANGE_PINK } from './presets.js';
import type { BaseStatusKey, Theme } from './tokens.js';
import { must } from '@flyingrobots/bijou/adapters/test';

const ALL_STATUS_KEYS: readonly BaseStatusKey[] = [
  'success', 'error', 'warning', 'info', 'pending', 'active', 'muted',
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function validateTheme(theme: Theme): void {
  describe(`theme: ${theme.name}`, () => {
    it('has all status keys defined', () => {
      for (const key of ALL_STATUS_KEYS) {
        expect(theme.status[key], `missing status key: ${key}`).toBeDefined();
        expect(theme.status[key].hex).toMatch(HEX_RE);
      }
    });

    it('has valid hex values in semantic tokens', () => {
      for (const [name, token] of Object.entries(theme.semantic)) {
        expect(token.hex, `semantic.${name} hex`).toMatch(HEX_RE);
      }
    });

    it('has valid hex values in border tokens', () => {
      for (const [name, token] of Object.entries(theme.border)) {
        expect(token.hex, `border.${name} hex`).toMatch(HEX_RE);
      }
    });

    it('has valid hex values in ui tokens', () => {
      for (const [name, token] of Object.entries(theme.ui)) {
        expect(token.hex, `ui.${name} hex`).toMatch(HEX_RE);
      }
    });

    it('has gradient stops sorted by position', () => {
      for (const [name, stops] of Object.entries(theme.gradient)) {
        for (let i = 1; i < stops.length; i++) {
          const prev = stops[i - 1];
          const curr = stops[i];
          expect(prev, `gradient.${name} stop ${String(i - 1)}`).toBeDefined();
          expect(curr, `gradient.${name} stop ${String(i)}`).toBeDefined();
          expect(must(curr).pos, `gradient.${name}[${String(i)}].pos >= [${String(i - 1)}].pos`)
            .toBeGreaterThanOrEqual(must(prev).pos);
        }
      }
    });

    it('has at least one gradient stop per gradient', () => {
      for (const [name, stops] of Object.entries(theme.gradient)) {
        expect(stops.length, `gradient.${name}`).toBeGreaterThanOrEqual(1);
      }
    });

    it('has finite byte RGB gradient stop components', () => {
      for (const [name, stops] of Object.entries(theme.gradient)) {
        for (const [index, stop] of stops.entries()) {
          for (const component of stop.color) {
            const label = `gradient.${name}[${String(index)}] component`;
            expect(Number.isInteger(component), label).toBe(true);
            expect(component, label).toBeGreaterThanOrEqual(0);
            expect(component, label).toBeLessThanOrEqual(255);
          }
        }
      }
    });

    it('has valid surface tokens with hex and bg', () => {
      for (const key of ['primary', 'secondary', 'elevated', 'overlay', 'muted'] as const) {
        const token = theme.surface[key];
        expect(token, `missing surface key: ${key}`).toBeDefined();
        expect(token.hex, `surface.${key} hex`).toMatch(HEX_RE);
        expect(token.bg, `surface.${key} bg`).toMatch(HEX_RE);
      }
    });
  });
}

describe('presets', () => {
  validateTheme(BIJOU_DARK);
  validateTheme(BIJOU_LIGHT);
  validateTheme(CYAN_MAGENTA);
  validateTheme(TEAL_ORANGE_PINK);

  for (const preset of Object.values(PRESETS)) {
    if (
      preset !== BIJOU_DARK
      && preset !== BIJOU_LIGHT
      && preset !== CYAN_MAGENTA
      && preset !== TEAL_ORANGE_PINK
    ) {
      validateTheme(preset);
    }
  }

  it('PRESETS registry includes the first-party defaults and legacy vivid themes', () => {
    expect(PRESETS['bijou-dark']).toBe(BIJOU_DARK);
    expect(PRESETS['bijou-light']).toBe(BIJOU_LIGHT);
    expect(PRESETS['cyan-magenta']).toBe(CYAN_MAGENTA);
    expect(PRESETS['teal-orange-pink']).toBe(TEAL_ORANGE_PINK);
  });

  it('PRESETS registry includes NORD and CATPPUCCIN', () => {
    expect(PRESETS['nord']).toBeDefined();
    expect(PRESETS['catppuccin']).toBeDefined();
  });
});
