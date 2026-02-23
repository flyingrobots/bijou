import { describe, it, expect } from 'vitest';
import { PRESETS, CYAN_MAGENTA, TEAL_ORANGE_PINK } from '../../theme/presets.js';
const ALL_STATUS_KEYS = [
    'success', 'error', 'warning', 'info', 'pending', 'active', 'muted',
];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
function validateTheme(theme) {
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
                    expect(prev, `gradient.${name} stop ${i - 1}`).toBeDefined();
                    expect(curr, `gradient.${name} stop ${i}`).toBeDefined();
                    expect(curr.pos, `gradient.${name}[${i}].pos >= [${i - 1}].pos`)
                        .toBeGreaterThanOrEqual(prev.pos);
                }
            }
        });
        it('has at least one gradient stop per gradient', () => {
            for (const [name, stops] of Object.entries(theme.gradient)) {
                expect(stops.length, `gradient.${name}`).toBeGreaterThanOrEqual(1);
            }
        });
    });
}
describe('presets', () => {
    validateTheme(CYAN_MAGENTA);
    validateTheme(TEAL_ORANGE_PINK);
    it('PRESETS registry includes both themes', () => {
        expect(PRESETS['cyan-magenta']).toBe(CYAN_MAGENTA);
        expect(PRESETS['teal-orange-pink']).toBe(TEAL_ORANGE_PINK);
    });
});
//# sourceMappingURL=presets.test.js.map