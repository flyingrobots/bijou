import { describe, it, expect } from 'vitest';
import { fromDTCG, toDTCG, type DTCGToken } from './dtcg.js';
import { CYAN_MAGENTA, PRESETS } from './presets.js';

function isRec(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }

function rec(value: unknown): Record<string, unknown> { if (isRec(value)) return value; throw new TypeError('object'); }

function isTok(value: unknown): value is DTCGToken { return isRec(value) && '$value' in value; }

function tok(value: unknown): DTCGToken { if (isTok(value)) return value; throw new TypeError('token'); }

describe('DTCG interop', () => {
  describe('round-trip', () => {
      it('toDTCG(fromDTCG(doc)) preserves structure', () => {
        const original = toDTCG(CYAN_MAGENTA);
        const theme = fromDTCG(original);
        const roundTripped = toDTCG(theme);

        expect(roundTripped['name']).toEqual(original['name']);

        const origStatus = rec(original['status']);
        const rtStatus = rec(roundTripped['status']);
        expect(tok(rtStatus['success']).$value).toBe(tok(origStatus['success']).$value);
        expect(tok(rtStatus['error']).$value).toBe(tok(origStatus['error']).$value);
      });

      it('fromDTCG(toDTCG(theme)) preserves theme values', () => {
        const roundTripped = fromDTCG(toDTCG(CYAN_MAGENTA));

        expect(roundTripped.name).toBe(CYAN_MAGENTA.name);
        expect(roundTripped.status.success.hex).toBe(CYAN_MAGENTA.status.success.hex);
        expect(roundTripped.status.pending.hex).toBe(CYAN_MAGENTA.status.pending.hex);
        expect(roundTripped.status.pending.modifiers).toEqual(CYAN_MAGENTA.status.pending.modifiers);
        expect(roundTripped.semantic.accent.hex).toBe(CYAN_MAGENTA.semantic.accent.hex);
        expect(roundTripped.border.primary.hex).toBe(CYAN_MAGENTA.border.primary.hex);
        expect(roundTripped.ui.cursor.hex).toBe(CYAN_MAGENTA.ui.cursor.hex);
      });

      it('every built-in preset survives round-trip', () => {
        for (const [name, preset] of Object.entries(PRESETS)) {
          const rt = fromDTCG(toDTCG(preset));
          expect(rt.name).toBe(name);
          expect(rt.status.success.hex).toBe(preset.status.success.hex);
          expect(rt.status.error.hex).toBe(preset.status.error.hex);
          expect(rt.status.pending.modifiers).toEqual(preset.status.pending.modifiers);
          expect(rt.status.muted.modifiers).toEqual(preset.status.muted.modifiers);
          expect(rt.border.primary.hex).toBe(preset.border.primary.hex);
          expect(rt.ui.cursor.hex).toBe(preset.ui.cursor.hex);
          expect(rt.gradient.brand).toHaveLength(preset.gradient.brand.length);
          expect(rt.gradient.progress).toHaveLength(preset.gradient.progress.length);
          expect(rt.surface.primary.hex).toBe(preset.surface.primary.hex);
          expect(rt.surface.primary.bg).toBe(preset.surface.primary.bg);
        }
      });
    });
});
