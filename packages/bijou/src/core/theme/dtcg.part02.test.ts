import { describe, it, expect } from 'vitest';
import { fromDTCG, type DTCGDocument } from './dtcg.js';

describe('DTCG interop', () => {
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
            focusGutter: { $type: 'color', $value: '#ff00ff' },
            scrollThumb: { $type: 'color', $value: '#00ffff' },
            scrollTrack: { $type: 'color', $value: '#808080' },
            sectionHeader: { $type: 'color', $value: '#0000ff' },
            logo: { $type: 'color', $value: '#00ffff' },
            tableHeader: { $type: 'color', $value: '#ffffff' },
            trackEmpty: { $type: 'color', $value: '#505050' },
          },
          surface: {
            primary: { $type: 'color', $value: { hex: '#ffffff', bg: '#1a1a2e' } },
            secondary: { $type: 'color', $value: '#e0e0e0' },
            elevated: { $type: 'color', $value: '#ffffff' },
            overlay: { $type: 'color', $value: '#ffffff' },
            muted: { $type: 'color', $value: '#808080' },
          },
        };

        const theme = fromDTCG(doc);
        expect(theme.name).toBe('test-theme');
        expect(theme.status.success.hex).toBe('#00ff00');
        expect(theme.ui.cursor.hex).toBe('#00ffff');
        expect(theme.gradient.brand).toHaveLength(2);
        expect(theme.gradient.brand[0]?.color).toEqual([0, 255, 255]);
        expect(theme.surface.primary.hex).toBe('#ffffff');
        expect(theme.surface.primary.bg).toBe('#1a1a2e');
      });

      it('resolves DTCG references', () => {
        const doc: DTCGDocument = {
          color: {
            primary: { $type: 'color', $value: '#3bcfd4' },
          },
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
            focusGutter: { $type: 'color', $value: '#ff00ff' },
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
});
