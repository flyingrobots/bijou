import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { progressBar } from '../../components/progress.js';
import { _resetThemeForTesting } from '../../theme/resolve.js';
describe('progressBar', () => {
    const originalEnv = { ...process.env };
    const originalIsTTY = process.stdout.isTTY;
    beforeEach(() => {
        _resetThemeForTesting();
        delete process.env['BIJOU_ACCESSIBLE'];
        delete process.env['NO_COLOR'];
        delete process.env['CI'];
        delete process.env['TERM'];
        delete process.env['BIJOU_THEME'];
        Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
    });
    afterEach(() => {
        process.env = { ...originalEnv };
        Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true });
        _resetThemeForTesting();
    });
    it('renders progress bar at 0%', () => {
        // CI mode = static (bar, no animation). NO_COLOR not set so detectOutputMode != pipe.
        process.env['CI'] = 'true';
        _resetThemeForTesting();
        const result = progressBar(0, { width: 10 });
        expect(result).toContain('[');
        expect(result).toContain(']');
        expect(result).toContain('0%');
    });
    it('renders progress bar at 100%', () => {
        process.env['CI'] = 'true';
        _resetThemeForTesting();
        const result = progressBar(100, { width: 10 });
        expect(result).toContain('100%');
        expect(result).toContain('██████████');
    });
    it('renders progress bar at 50%', () => {
        process.env['CI'] = 'true';
        _resetThemeForTesting();
        const result = progressBar(50, { width: 10 });
        expect(result).toContain('50%');
        expect(result).toContain('█████');
        expect(result).toContain('░░░░░');
    });
    it('clamps below 0', () => {
        process.env['CI'] = 'true';
        _resetThemeForTesting();
        const result = progressBar(-10, { width: 10 });
        expect(result).toContain('0%');
    });
    it('clamps above 100', () => {
        process.env['CI'] = 'true';
        _resetThemeForTesting();
        const result = progressBar(150, { width: 10 });
        expect(result).toContain('100%');
    });
    it('hides percent when showPercent is false', () => {
        process.env['CI'] = 'true';
        _resetThemeForTesting();
        const result = progressBar(50, { width: 10, showPercent: false });
        expect(result).not.toContain('%');
    });
    it('returns pipe format when piped', () => {
        Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
        const result = progressBar(45);
        expect(result).toBe('Progress: 45%');
    });
    it('returns accessible format', () => {
        process.env['BIJOU_ACCESSIBLE'] = '1';
        const result = progressBar(45);
        expect(result).toBe('45 percent complete.');
    });
    it('uses custom filled and empty characters', () => {
        process.env['CI'] = 'true';
        _resetThemeForTesting();
        const result = progressBar(50, { width: 4, filled: '#', empty: '-' });
        expect(result).toContain('##--');
    });
});
//# sourceMappingURL=progress.test.js.map