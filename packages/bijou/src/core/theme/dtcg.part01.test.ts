import { describe, it, expect } from 'vitest';
import { toDTCG, type DTCGToken } from './dtcg.js';
import { CYAN_MAGENTA } from './presets.js';

function isRec(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }

function rec(value: unknown): Record<string, unknown> { if (isRec(value)) return value; throw new TypeError('object'); }

function isTok(value: unknown): value is DTCGToken { return isRec(value) && '$value' in value; }

function tok(value: unknown): DTCGToken { if (isTok(value)) return value; throw new TypeError('token'); }

describe('DTCG interop', () => {
  describe('toDTCG', () => {
      it('converts a theme to DTCG format', () => {
        const doc = toDTCG(CYAN_MAGENTA);
        expect(doc['name']).toEqual({ $type: 'string', $value: 'cyan-magenta' });
        expect(doc['status']).toBeDefined();
        expect(doc['semantic']).toBeDefined();
        expect(doc['gradient']).toBeDefined();
        expect(doc['border']).toBeDefined();
        expect(doc['ui']).toBeDefined();
      });

      it('encodes color tokens as hex strings', () => {
        const doc = toDTCG(CYAN_MAGENTA);
        const status = rec(doc['status']);
        expect(status['success']).toEqual({ $type: 'color', $value: '#00ff00' });
      });

      it('encodes tokens with modifiers as objects', () => {
        const doc = toDTCG(CYAN_MAGENTA);
        const status = rec(doc['status']);
        expect(status['pending']).toEqual({
          $type: 'color',
          $value: { hex: '#808080', modifiers: ['dim'] },
        });
      });

      it('encodes surface tokens', () => {
        const doc = toDTCG(CYAN_MAGENTA);
        const surface = rec(doc['surface']);
        for (const key of ['primary', 'secondary', 'elevated', 'overlay', 'muted']) {
          const t = tok(surface[key]);
          expect(t.$type, `surface.${key}`).toBe('color');
          expect(t.$value).toBeDefined();
        }
      });

      it('encodes gradient stops', () => {
        const doc = toDTCG(CYAN_MAGENTA);
        const gradient = rec(doc['gradient']);
        const brand = tok(gradient['brand']);
        expect(brand.$type).toBe('gradient');
        expect(Array.isArray(brand.$value)).toBe(true);
      });
    });
});
