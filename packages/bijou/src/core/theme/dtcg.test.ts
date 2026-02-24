import { describe, it, expect } from 'vitest';
import { fromDTCG, toDTCG, type DTCGDocument } from './dtcg.js';
import { CYAN_MAGENTA, PRESETS } from './presets.js';

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

    it('every built-in preset survives round-trip', () => {
      for (const [name, preset] of Object.entries(PRESETS)) {
        const rt = fromDTCG(toDTCG(preset));
        expect(rt.name).toBe(name);
        expect(rt.status.success.hex).toBe(preset.status.success.hex);
        expect(rt.status.error.hex).toBe(preset.status.error.hex);
        expect(rt.border.primary.hex).toBe(preset.border.primary.hex);
        expect(rt.ui.cursor.hex).toBe(preset.ui.cursor.hex);
        // Gradient stop count preserved
        expect(rt.gradient.brand).toHaveLength(preset.gradient.brand.length);
        expect(rt.gradient.progress).toHaveLength(preset.gradient.progress.length);
      }
    });
  });

  describe('fromDTCG edge cases', () => {
    it('unresolvable reference passes raw ref string as hex value', () => {
      const doc: DTCGDocument = {
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
          brand: { $type: 'gradient', $value: [] },
          progress: { $type: 'gradient', $value: [] },
        },
        border: {
          primary: { $value: '#aaa' }, secondary: { $value: '#aaa' },
          success: { $value: '#aaa' }, warning: { $value: '#aaa' },
          error: { $value: '#aaa' }, muted: { $value: '#aaa' },
        },
        ui: {
          cursor: { $value: '#aaa' }, scrollThumb: { $value: '#aaa' },
          scrollTrack: { $value: '#aaa' }, sectionHeader: { $value: '#aaa' },
          logo: { $value: '#aaa' }, tableHeader: { $value: '#aaa' },
          trackEmpty: { $value: '#aaa' },
        },
      };

      const theme = fromDTCG(doc);
      // Unresolvable ref string is treated as the hex value
      expect(theme.status.success.hex).toBe('{nonexistent.path}');
    });

    it('circular references do not crash (return raw ref string)', () => {
      const doc: DTCGDocument = {
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
        semantic: {
          success: { $value: '#0f0' }, error: { $value: '#f00' },
          warning: { $value: '#ff0' }, info: { $value: '#0ff' },
          accent: { $value: '#f0f' }, muted: { $value: '#888' },
          primary: { $value: '#fff' },
        },
        gradient: {
          brand: { $type: 'gradient', $value: [] },
          progress: { $type: 'gradient', $value: [] },
        },
        border: {
          primary: { $value: '#aaa' }, secondary: { $value: '#aaa' },
          success: { $value: '#aaa' }, warning: { $value: '#aaa' },
          error: { $value: '#aaa' }, muted: { $value: '#aaa' },
        },
        ui: {
          cursor: { $value: '#aaa' }, scrollThumb: { $value: '#aaa' },
          scrollTrack: { $value: '#aaa' }, sectionHeader: { $value: '#aaa' },
          logo: { $value: '#aaa' }, tableHeader: { $value: '#aaa' },
          trackEmpty: { $value: '#aaa' },
        },
      };

      // Should not throw — just returns the ref string as-is since it resolves to another ref
      expect(() => fromDTCG(doc)).not.toThrow();
    });

    it('missing optional groups produce default #000000 tokens', () => {
      const doc: DTCGDocument = {
        name: { $type: 'string', $value: 'minimal' },
        // Everything else missing
      };

      const theme = fromDTCG(doc);
      expect(theme.name).toBe('minimal');
      expect(theme.status.success.hex).toBe('#000000');
      expect(theme.semantic.primary.hex).toBe('#000000');
      expect(theme.border.primary.hex).toBe('#000000');
      expect(theme.ui.cursor.hex).toBe('#000000');
      expect(theme.gradient.brand).toEqual([]);
    });

    it('missing name defaults to "imported"', () => {
      const doc: DTCGDocument = {};
      const theme = fromDTCG(doc);
      expect(theme.name).toBe('imported');
    });
  });

  describe('toDTCG edge cases', () => {
    it('preserves modifier metadata through toDTCG', () => {
      const doc = toDTCG(CYAN_MAGENTA);
      const status = doc['status'] as Record<string, { $type: string; $value: unknown }>;
      // pending has ['dim'] modifier
      const pending = status['pending']!.$value as { hex: string; modifiers: string[] };
      expect(pending.modifiers).toEqual(['dim']);
    });

    it('tokens without modifiers are encoded as plain hex strings', () => {
      const doc = toDTCG(CYAN_MAGENTA);
      const status = doc['status'] as Record<string, { $type: string; $value: unknown }>;
      // success has no modifiers
      expect(typeof status['success']!.$value).toBe('string');
    });

    it('gradient stops encode RGB as hex strings', () => {
      const doc = toDTCG(CYAN_MAGENTA);
      const gradient = doc['gradient'] as Record<string, { $value: unknown }>;
      const stops = gradient['brand']!.$value as Array<{ pos: number; color: string }>;
      expect(stops.length).toBeGreaterThan(0);
      for (const stop of stops) {
        expect(stop.color).toMatch(/^#[0-9a-f]{6}$/);
        expect(typeof stop.pos).toBe('number');
      }
    });
  });
});
