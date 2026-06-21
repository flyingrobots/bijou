import { describe, it, expect } from 'vitest';
import { fromDTCG, toDTCG, type DTCGToken } from './dtcg.js';
import { CYAN_MAGENTA } from './presets.js';

function isRec(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }

function rec(value: unknown): Record<string, unknown> { if (isRec(value)) return value; throw new TypeError('object'); }

function isTok(value: unknown): value is DTCGToken { return isRec(value) && '$value' in value; }

function tok(value: unknown): DTCGToken { if (isTok(value)) return value; throw new TypeError('token'); }

function stops(value: unknown): readonly Record<string, unknown>[] { if (Array.isArray(value) && value.every(isRec)) return value; throw new TypeError('stops'); }

function text(value: unknown): string { if (typeof value === 'string') return value; throw new TypeError('string'); }

describe('DTCG interop', () => {
  describe('toDTCG edge cases', () => {
      it('gradient stops encode RGB as hex strings', () => {
        const doc = toDTCG(CYAN_MAGENTA);
        const gradient = rec(doc['gradient']);
        const gradientStops = stops(tok(gradient['brand']).$value);
        expect(gradientStops.length).toBeGreaterThan(0);
        for (const stop of gradientStops) {
          expect(text(stop['color'])).toMatch(/^#[0-9a-f]{6}$/);
          expect(typeof stop['pos']).toBe('number');
        }
      });

      it('every token has $type and $value, groups are objects, name is string', () => {
        const doc = toDTCG(CYAN_MAGENTA);

        const name = tok(doc['name']);
        expect(name.$type).toBe('string');
        expect(typeof name.$value).toBe('string');

        for (const groupKey of ['status', 'semantic', 'border', 'ui', 'surface']) {
          const group = rec(doc[groupKey]);
          for (const [, groupToken] of Object.entries(group)) {
            expect(tok(groupToken).$type).toBe('color');
            expect(tok(groupToken).$value).toBeDefined();
          }
        }

        const gradient = rec(doc['gradient']);
        for (const [, groupToken] of Object.entries(gradient)) {
          expect(tok(groupToken).$type).toBe('gradient');
          expect(Array.isArray(tok(groupToken).$value)).toBe(true);
        }
      });
    });

  describe('custom theme round-trip', () => {
      it('round-trips a theme with all modifier types and multi-stop gradients', () => {
        const custom: import('./tokens.js').Theme = {
          name: 'all-modifiers',
          status: {
            success: { hex: '#00ff00' },
            error: { hex: '#ff0000', modifiers: ['bold'] },
            warning: { hex: '#ffff00', modifiers: ['dim'] },
            info: { hex: '#00ffff', modifiers: ['strikethrough'] },
            pending: { hex: '#808080', modifiers: ['inverse'] },
            active: { hex: '#aabbcc', modifiers: ['bold', 'dim'] },
            muted: { hex: '#333333', modifiers: ['dim'] },
          },
          semantic: {
            success: { hex: '#11aa11' },
            error: { hex: '#cc0000' },
            warning: { hex: '#dddd00' },
            info: { hex: '#0099cc' },
            accent: { hex: '#ff00ff', modifiers: ['bold'] },
            muted: { hex: '#555555' },
            primary: { hex: '#ffffff' },
          },
          border: {
            primary: { hex: '#aaaaaa' },
            secondary: { hex: '#bbbbbb' },
            success: { hex: '#00cc00' },
            warning: { hex: '#cccc00' },
            error: { hex: '#cc0000' },
            muted: { hex: '#444444' },
          },
          ui: {
            cursor: { hex: '#ff00ff' },
            focusGutter: { hex: '#ff66cc' },
            scrollThumb: { hex: '#cccccc' },
            scrollTrack: { hex: '#222222' },
            sectionHeader: { hex: '#0000ff', modifiers: ['bold'] },
            logo: { hex: '#00ffff' },
            tableHeader: { hex: '#ffffff', modifiers: ['bold'] },
            trackEmpty: { hex: '#333333' },
          },
          gradient: {
            brand: [
              { pos: 0, color: [255, 0, 0] },
              { pos: 0.33, color: [0, 255, 0] },
              { pos: 0.66, color: [0, 0, 255] },
              { pos: 1, color: [255, 255, 0] },
            ],
            progress: [
              { pos: 0, color: [0, 0, 0] },
              { pos: 0.5, color: [128, 128, 128] },
              { pos: 1, color: [255, 255, 255] },
            ],
          },
          surface: {
            primary:   { hex: '#ffffff', bg: '#1a1a2e' },
            secondary: { hex: '#e0e0e0', bg: '#16213e' },
            elevated:  { hex: '#ffffff', bg: '#0f3460' },
            overlay:   { hex: '#ffffff', bg: '#1a1a2e' },
            muted:     { hex: '#808080', bg: '#0a0a14' },
          },
        };

        const rt = fromDTCG(toDTCG(custom));

        expect(rt.name).toBe('all-modifiers');
        expect(rt.status.error.modifiers).toEqual(['bold']);
        expect(rt.status.warning.modifiers).toEqual(['dim']);
        expect(rt.status.info.modifiers).toEqual(['strikethrough']);
        expect(rt.status.pending.modifiers).toEqual(['inverse']);
        expect(rt.status.active.modifiers).toEqual(['bold', 'dim']);
        expect(rt.status.success.modifiers).toBeUndefined();
        expect(rt.semantic.accent.modifiers).toEqual(['bold']);
        expect(rt.ui.sectionHeader.modifiers).toEqual(['bold']);
        expect(rt.gradient.brand).toHaveLength(4);
        expect(rt.gradient.progress).toHaveLength(3);
        expect(rt.gradient.brand[1]?.pos).toBe(0.33);
        expect(rt.gradient.brand[1]?.color).toEqual([0, 255, 0]);
        expect(rt.surface.primary.hex).toBe('#ffffff');
        expect(rt.surface.primary.bg).toBe('#1a1a2e');
        expect(rt.surface.muted.bg).toBe('#0a0a14');
      });
    });
});
