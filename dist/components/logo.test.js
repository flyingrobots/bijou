import { describe, it, expect } from 'vitest';
import { selectLogoSize, loadRandomLogo } from './logo.js';
describe('selectLogoSize', () => {
    it('returns small for narrow terminals', () => {
        expect(selectLogoSize(50, 25)).toBe('small');
    });
    it('returns small for short terminals', () => {
        expect(selectLogoSize(120, 15)).toBe('small');
    });
    it('returns medium for mid-size terminals', () => {
        expect(selectLogoSize(80, 25)).toBe('medium');
    });
    it('returns large for wide terminals', () => {
        expect(selectLogoSize(120, 40)).toBe('large');
    });
});
describe('loadRandomLogo', () => {
    it('returns fallback for nonexistent directory', () => {
        const result = loadRandomLogo('/nonexistent', 'test', 'large');
        expect(result.text).toBe('BIJOU');
        expect(result.lines).toBe(1);
        expect(result.width).toBe(5);
    });
    it('uses custom fallback text', () => {
        const result = loadRandomLogo('/nonexistent', 'test', 'large', undefined, { fallbackText: 'MY APP' });
        expect(result.text).toBe('MY APP');
        expect(result.width).toBe(6);
    });
});
//# sourceMappingURL=logo.test.js.map