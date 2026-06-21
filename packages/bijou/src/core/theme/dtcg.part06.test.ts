import { describe, it, expect } from 'vitest';
import { fromDTCG, toDTCG } from './dtcg.js';
import { PRESETS } from './presets.js';

describe('DTCG interop', () => {
  describe('bg field round-trip', () => {
      it('bg field round-trips through DTCG', () => {
        const theme: import('./tokens.js').Theme = {
          name: 'bg-test',
          status: {
            success: { hex: '#00ff00' },
            error: { hex: '#ff0000' },
            warning: { hex: '#ffff00' },
            info: { hex: '#00ffff' },
            pending: { hex: '#808080' },
            active: { hex: '#00ffff' },
            muted: { hex: '#808080' },
          },
          semantic: {
            success: { hex: '#00ff00' },
            error: { hex: '#ff0000' },
            warning: { hex: '#ffff00' },
            info: { hex: '#00ffff' },
            accent: { hex: '#ff00ff' },
            muted: { hex: '#808080' },
            primary: { hex: '#ffffff' },
          },
          border: {
            primary: { hex: '#00ffff' },
            secondary: { hex: '#ff00ff' },
            success: { hex: '#00ff00' },
            warning: { hex: '#ffff00' },
            error: { hex: '#ff0000' },
            muted: { hex: '#808080' },
          },
          ui: {
            cursor: { hex: '#00ffff' },
            focusGutter: { hex: '#ff00ff' },
            scrollThumb: { hex: '#00ffff' },
            scrollTrack: { hex: '#808080' },
            sectionHeader: { hex: '#0000ff' },
            logo: { hex: '#00ffff' },
            tableHeader: { hex: '#ffffff' },
            trackEmpty: { hex: '#505050' },
          },
          gradient: {
            brand: [{ pos: 0, color: [0, 255, 255] }, { pos: 1, color: [255, 0, 255] }],
            progress: [{ pos: 0, color: [0, 255, 255] }, { pos: 1, color: [255, 0, 255] }],
          },
          surface: {
            primary:   { hex: '#d1d5db', bg: '#1f2937' },
            secondary: { hex: '#d1d5db', bg: '#111827' },
            elevated:  { hex: '#d1d5db', bg: '#374151' },
            overlay:   { hex: '#d1d5db', bg: '#1f2937' },
            muted:     { hex: '#6b7280', bg: '#0f1117' },
          },
        };

        const rt = fromDTCG(toDTCG(theme));
        expect(rt.surface.primary.bg).toBe('#1f2937');
        expect(rt.surface.secondary.bg).toBe('#111827');
        expect(rt.surface.elevated.bg).toBe('#374151');
        expect(rt.surface.overlay.bg).toBe('#1f2937');
        expect(rt.surface.muted.bg).toBe('#0f1117');
      });

      it('surface tokens survive round-trip with bg field', () => {
        for (const [, preset] of Object.entries(PRESETS)) {
          const rt = fromDTCG(toDTCG(preset));
          for (const key of ['primary', 'secondary', 'elevated', 'overlay', 'muted'] as const) {
            expect(rt.surface[key].hex).toBe(preset.surface[key].hex);
            expect(rt.surface[key].bg).toBe(preset.surface[key].bg);
          }
        }
      });
    });
});
