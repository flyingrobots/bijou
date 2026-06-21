import { describe, it, expect } from 'vitest';
import { fromDTCG, type DTCGDocument } from './dtcg.js';

describe('DTCG interop', () => {
  describe('fromDTCG edge cases', () => {
      function minimalDoc(overrides: Partial<DTCGDocument> = {}): DTCGDocument {
        const filler = (keys: string[]) =>
          Object.fromEntries(keys.map(k => [k, { $value: '#aaa' }]));
        return {
          name: { $type: 'string', $value: 'test' },
          status: filler(['success', 'error', 'warning', 'info', 'pending', 'active', 'muted']),
          semantic: filler(['success', 'error', 'warning', 'info', 'accent', 'muted', 'primary']),
          gradient: { brand: { $type: 'gradient', $value: [] }, progress: { $type: 'gradient', $value: [] } },
          border: filler(['primary', 'secondary', 'success', 'warning', 'error', 'muted']),
          ui: filler(['cursor', 'focusGutter', 'scrollThumb', 'scrollTrack', 'sectionHeader', 'logo', 'tableHeader', 'trackEmpty']),
          surface: filler(['primary', 'secondary', 'elevated', 'overlay', 'muted']),
          ...overrides,
        };
      }

      it('throws on unresolvable references', () => {
        const doc = minimalDoc({
          name: { $type: 'string', $value: 'ref-broken' },
          status: {
            success: { $type: 'color', $value: '{nonexistent.path}' },
            error: { $type: 'color', $value: '#ff0000' },
            warning: { $type: 'color', $value: '#ffff00' },
            info: { $type: 'color', $value: '#00ffff' },
            pending: { $type: 'color', $value: '#808080' },
            active: { $type: 'color', $value: '#00ffff' },
            muted: { $type: 'color', $value: '#808080' },
          },
        });

        expect(() => fromDTCG(doc)).toThrow('Unresolvable reference: {nonexistent.path}');
      });

      it('throws on circular references', () => {
        const doc = minimalDoc({
          a: { $type: 'color', $value: '{b}' },
          b: { $type: 'color', $value: '{a}' },
          name: { $type: 'string', $value: 'circular' },
          status: {
            success: { $type: 'color', $value: '{a}' },
            error: { $type: 'color', $value: '#ff0000' },
            warning: { $type: 'color', $value: '#ffff00' },
            info: { $type: 'color', $value: '#00ffff' },
            pending: { $type: 'color', $value: '#808080' },
            active: { $type: 'color', $value: '#00ffff' },
            muted: { $type: 'color', $value: '#808080' },
          },
        });

        expect(() => fromDTCG(doc)).toThrow('Circular reference detected');
      });

      it('resolves multi-level reference chains', () => {
        const doc = minimalDoc({
          a: { $type: 'color', $value: '{b}' },
          b: { $type: 'color', $value: '#ff0000' },
          name: { $type: 'string', $value: 'chain' },
          status: {
            success: { $type: 'color', $value: '{a}' },
            error: { $type: 'color', $value: '#ff0000' },
            warning: { $type: 'color', $value: '#ffff00' },
            info: { $type: 'color', $value: '#00ffff' },
            pending: { $type: 'color', $value: '#808080' },
            active: { $type: 'color', $value: '#00ffff' },
            muted: { $type: 'color', $value: '#808080' },
          },
        });

        const theme = fromDTCG(doc);
        expect(theme.status.success.hex).toBe('#ff0000');
      });

      it('missing optional groups produce default #000000 tokens', () => {
        const doc: DTCGDocument = {
          name: { $type: 'string', $value: 'minimal' },
        };

        const theme = fromDTCG(doc);
        expect(theme.name).toBe('minimal');
        expect(theme.status.success.hex).toBe('#000000');
        expect(theme.semantic.primary.hex).toBe('#000000');
        expect(theme.border.primary.hex).toBe('#000000');
        expect(theme.ui.cursor.hex).toBe('#000000');
        expect(theme.gradient.brand).toEqual([]);
        expect(theme.surface.primary.hex).toBe('#000000');
        expect(theme.surface.muted.hex).toBe('#000000');
      });

      it('partial group fills missing tokens with #000000', () => {
        const doc: DTCGDocument = {
          name: { $type: 'string', $value: 'partial' },
          status: {
            success: { $type: 'color', $value: '#11ff11' },
          },
          semantic: {
            primary: { $type: 'color', $value: '#ffffff' },
          },
          border: {},
          ui: {},
          gradient: {},
          surface: {
            primary: { $type: 'color', $value: '#eeeeee' },
          },
        };

        const theme = fromDTCG(doc);
        expect(theme.status.success.hex).toBe('#11ff11');
        expect(theme.status.error.hex).toBe('#000000');
        expect(theme.semantic.primary.hex).toBe('#ffffff');
        expect(theme.semantic.accent.hex).toBe('#000000');
        expect(theme.border.primary.hex).toBe('#000000');
        expect(theme.ui.cursor.hex).toBe('#000000');
        expect(theme.gradient.brand).toEqual([]);
        expect(theme.surface.primary.hex).toBe('#eeeeee');
        expect(theme.surface.secondary.hex).toBe('#000000');
      });

      it('missing name defaults to "imported"', () => {
        const doc: DTCGDocument = {};
        const theme = fromDTCG(doc);
        expect(theme.name).toBe('imported');
      });
    });
});
