import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { lerp3, gradientText } from './gradient.js';
import { _resetThemeForTesting } from './resolve.js';
describe('lerp3', () => {
    const twoStop = [
        { pos: 0, color: [0, 0, 0] },
        { pos: 1, color: [255, 255, 255] },
    ];
    const threeStop = [
        { pos: 0, color: [0, 255, 255] },
        { pos: 0.5, color: [252, 147, 5] },
        { pos: 1, color: [242, 0, 148] },
    ];
    it('returns first stop color at t=0', () => {
        expect(lerp3(twoStop, 0)).toEqual([0, 0, 0]);
    });
    it('returns last stop color at t=1', () => {
        expect(lerp3(twoStop, 1)).toEqual([255, 255, 255]);
    });
    it('interpolates midpoint of two-stop gradient', () => {
        const mid = lerp3(twoStop, 0.5);
        expect(mid).toEqual([128, 128, 128]);
    });
    it('clamps below first stop position', () => {
        expect(lerp3(twoStop, -0.5)).toEqual([0, 0, 0]);
    });
    it('clamps above last stop position', () => {
        expect(lerp3(twoStop, 1.5)).toEqual([255, 255, 255]);
    });
    it('interpolates three-stop gradient at midpoint', () => {
        const mid = lerp3(threeStop, 0.5);
        expect(mid).toEqual([252, 147, 5]);
    });
    it('interpolates three-stop gradient at t=0.25', () => {
        const result = lerp3(threeStop, 0.25);
        expect(result).toEqual([126, 201, 130]);
    });
    it('returns [0,0,0] for empty stops array', () => {
        expect(lerp3([], 0.5)).toEqual([0, 0, 0]);
    });
    it('returns the single color for a single-stop array', () => {
        const single = [{ pos: 0.5, color: [100, 200, 50] }];
        expect(lerp3(single, 0)).toEqual([100, 200, 50]);
        expect(lerp3(single, 0.5)).toEqual([100, 200, 50]);
        expect(lerp3(single, 1)).toEqual([100, 200, 50]);
    });
});
describe('gradientText', () => {
    const stops = [
        { pos: 0, color: [255, 0, 0] },
        { pos: 1, color: [0, 0, 255] },
    ];
    beforeEach(() => {
        _resetThemeForTesting();
        delete process.env['NO_COLOR'];
    });
    afterEach(() => {
        _resetThemeForTesting();
    });
    it('returns plain text when NO_COLOR is set', () => {
        process.env['NO_COLOR'] = '1';
        expect(gradientText('hello', stops)).toBe('hello');
    });
    it('returns empty string for empty input', () => {
        expect(gradientText('', stops)).toBe('');
    });
    it('returns plain text for empty stops', () => {
        expect(gradientText('hello', [])).toBe('hello');
    });
    it('preserves spaces and newlines', () => {
        const result = gradientText('a b', stops);
        expect(result).toContain(' ');
    });
    it('contains the original characters regardless of color support', () => {
        const result = gradientText('ab', stops);
        expect(result).toContain('a');
        expect(result).toContain('b');
    });
});
//# sourceMappingURL=gradient.test.js.map