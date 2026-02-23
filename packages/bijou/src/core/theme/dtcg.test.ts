import { describe, it, expect } from 'vitest';
import { fromDTCG, toDTCG, type DTCGDocument } from './dtcg.js';
import { CYAN_MAGENTA } from './presets.js';

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
      const status = doc['status'] as Record<string, { $type: string; $value: unknown }>;
      expect(status['success']).toEqual({ $type: 'color', $value: '#00ff00' });
    });

    it('encodes tokens with modifiers as objects', () => {
      const doc = toDTCG(CYAN_MAGENTA);
      const status = doc['status'] as Record<string, { $type: string; $value: unknown }>;
      expect(status['pending']).toEqual({
        $type: 'color',
        $value: { hex: '#808080', modifiers: ['dim'] },
      });
    });

    it('encodes gradient stops', () => {
      const doc = toDTCG(CYAN_MAGENTA);
      const gradient = doc['gradient'] as Record<string, { $type: string; $value: unknown }>;
      const brand = gradient['brand'];
      expect(brand!.$type).toBe('gradient');
      expect(Array.isArray(brand!.$value)).toBe(true);
    });
  });

  describe('fromDTCG', () => {
    it('converts DTCG document to theme', () => {
      const doc: DTCGDocument = {
        name: { $type: 'string', $value: 'test-theme' },
        status: {
          success: { $type: 'color', $value: '#00ff00' },
          error: { $type: 'color', $value: '#ff0000' },
          warning: { $type: 'color', $value: '#ffff00' },
          info: { $type: 'color', $value: '#00ffff' },
          pending: { $type: 'color', $value: '#808080' },
          active: { $type: 'color', $value: '#00ffff' },
          muted: { $type: 'color', $value: '#808080' },
        },
        semantic: {
          success: { $type: 'color', $value: '#00ff00' },
          error: { $type: 'color', $value: '#ff0000' },
          warning: { $type: 'color', $value: '#ffff00' },
          info: { $type: 'color', $value: '#00ffff' },
          accent: { $type: 'color', $value: '#ff00ff' },
          muted: { $type: 'color', $value: '#808080' },
          primary: { $type: 'color', $value: '#ffffff' },
        },
        gradient: {
          brand: { $type: 'gradient', $value: [{ pos: 0, color: '#00ffff' }, { pos: 1, color: '#ff00ff' }] },
          progress: { $type: 'gradient', $value: [{ pos: 0, color: '#00ffff' }, { pos: 1, color: '#ff00ff' }] },
        },
        border: {
          primary: { $type: 'color', $value: '#00ffff' },
          secondary: { $type: 'color', $value: '#ff00ff' },
          success: { $type: 'color', $value: '#00ff00' },
          warning: { $type: 'color', $value: '#ffff00' },
          error: { $type: 'color', $value: '#ff0000' },
          muted: { $type: 'color', $value: '#808080' },
        },
        ui: {
          cursor: { $type: 'color', $value: '#00ffff' },
          scrollThumb: { $type: 'color', $value: '#00ffff' },
          scrollTrack: { $type: 'color', $value: '#808080' },
          sectionHeader: { $type: 'color', $value: '#0000ff' },
          logo: { $type: 'color', $value: '#00ffff' },
          tableHeader: { $type: 'color', $value: '#ffffff' },
          trackEmpty: { $type: 'color', $value: '#505050' },
        },
      };

      const theme = fromDTCG(doc);
      expect(theme.name).toBe('test-theme');
      expect(theme.status.success.hex).toBe('#00ff00');
      expect(theme.ui.cursor.hex).toBe('#00ffff');
      expect(theme.gradient.brand).toHaveLength(2);
      expect(theme.gradient.brand[0]!.color).toEqual([0, 255, 255]);
    });

    it('resolves DTCG references', () => {
      const doc: DTCGDocument = {
        color: {
          primary: { $type: 'color', $value: '#3bcfd4' },
        } as DTCGDocument['string'],
        name: { $type: 'string', $value: 'ref-test' },
        status: {
          success: { $type: 'color', $value: '#00ff00' },
          error: { $type: 'color', $value: '#ff0000' },
          warning: { $type: 'color', $value: '#ffff00' },
          info: { $type: 'color', $value: '{color.primary}' },
          pending: { $type: 'color', $value: '#808080' },
          active: { $type: 'color', $value: '{color.primary}' },
          muted: { $type: 'color', $value: '#808080' },
        },
        semantic: {
          success: { $type: 'color', $value: '#00ff00' },
          error: { $type: 'color', $value: '#ff0000' },
          warning: { $type: 'color', $value: '#ffff00' },
          info: { $type: 'color', $value: '{color.primary}' },
          accent: { $type: 'color', $value: '#ff00ff' },
          muted: { $type: 'color', $value: '#808080' },
          primary: { $type: 'color', $value: '#ffffff' },
        },
        gradient: {
          brand: { $type: 'gradient', $value: [] },
          progress: { $type: 'gradient', $value: [] },
        },
        border: {
          primary: { $type: 'color', $value: '#00ffff' },
          secondary: { $type: 'color', $value: '#ff00ff' },
          success: { $type: 'color', $value: '#00ff00' },
          warning: { $type: 'color', $value: '#ffff00' },
          error: { $type: 'color', $value: '#ff0000' },
          muted: { $type: 'color', $value: '#808080' },
        },
        ui: {
          cursor: { $type: 'color', $value: '#00ffff' },
          scrollThumb: { $type: 'color', $value: '#00ffff' },
          scrollTrack: { $type: 'color', $value: '#808080' },
          sectionHeader: { $type: 'color', $value: '#0000ff' },
          logo: { $type: 'color', $value: '#00ffff' },
          tableHeader: { $type: 'color', $value: '#ffffff' },
          trackEmpty: { $type: 'color', $value: '#505050' },
        },
      };

      const theme = fromDTCG(doc);
      expect(theme.status.info.hex).toBe('#3bcfd4');
      expect(theme.semantic.info.hex).toBe('#3bcfd4');
    });
  });

  describe('round-trip', () => {
    it('toDTCG(fromDTCG(doc)) preserves structure', () => {
      const original = toDTCG(CYAN_MAGENTA);
      const theme = fromDTCG(original);
      const roundTripped = toDTCG(theme);

      // Name should match
      expect(roundTripped['name']).toEqual(original['name']);

      // Status tokens with simple hex should match
      const origStatus = original['status'] as Record<string, { $value: unknown }>;
      const rtStatus = roundTripped['status'] as Record<string, { $value: unknown }>;
      expect(rtStatus['success']!.$value).toBe(origStatus['success']!.$value);
      expect(rtStatus['error']!.$value).toBe(origStatus['error']!.$value);
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
  });
});
