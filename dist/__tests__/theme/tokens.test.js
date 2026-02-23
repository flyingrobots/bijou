import { describe, it, expect } from 'vitest';
describe('theme/tokens types', () => {
    it('BaseStatusKey includes all expected keys', () => {
        const keys = ['success', 'error', 'warning', 'info', 'pending', 'active', 'muted'];
        expect(keys).toHaveLength(7);
    });
    it('TokenValue supports hex + modifiers', () => {
        const token = { hex: '#ff0000', modifiers: ['bold', 'dim'] };
        expect(token.hex).toBe('#ff0000');
        expect(token.modifiers).toEqual(['bold', 'dim']);
    });
    it('TokenValue modifiers are optional', () => {
        const token = { hex: '#ffffff' };
        expect(token.modifiers).toBeUndefined();
    });
    it('RGB is a triple of numbers', () => {
        const rgb = [255, 128, 0];
        expect(rgb).toHaveLength(3);
    });
    it('GradientStop has pos and color', () => {
        const stop = { pos: 0.5, color: [128, 128, 128] };
        expect(stop.pos).toBe(0.5);
        expect(stop.color).toEqual([128, 128, 128]);
    });
    it('TextModifier includes all variants', () => {
        const mods = ['bold', 'dim', 'strikethrough', 'inverse'];
        expect(mods).toHaveLength(4);
    });
    it('Theme<S> can be parameterized with custom status keys', () => {
        const theme = {
            name: 'test',
            status: {
                success: { hex: '#00ff00' },
                error: { hex: '#ff0000' },
                warning: { hex: '#ffff00' },
                info: { hex: '#00ffff' },
                pending: { hex: '#808080' },
                active: { hex: '#00ffff' },
                muted: { hex: '#808080' },
                CUSTOM: { hex: '#ff00ff' },
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
            gradient: {},
            border: {
                primary: { hex: '#00ffff' },
                secondary: { hex: '#ff00ff' },
                success: { hex: '#00ff00' },
                warning: { hex: '#ffff00' },
                error: { hex: '#ff0000' },
                muted: { hex: '#808080' },
            },
            ui: {},
        };
        expect(theme.status.CUSTOM.hex).toBe('#ff00ff');
    });
});
//# sourceMappingURL=tokens.test.js.map