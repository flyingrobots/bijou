import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectOutputMode } from './tty.js';
describe('detectOutputMode', () => {
    const originalEnv = { ...process.env };
    const originalIsTTY = process.stdout.isTTY;
    beforeEach(() => {
        delete process.env['BIJOU_ACCESSIBLE'];
        delete process.env['NO_COLOR'];
        delete process.env['CI'];
        delete process.env['TERM'];
    });
    afterEach(() => {
        process.env = { ...originalEnv };
        Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, writable: true });
    });
    it('returns accessible when BIJOU_ACCESSIBLE=1', () => {
        process.env['BIJOU_ACCESSIBLE'] = '1';
        expect(detectOutputMode()).toBe('accessible');
    });
    it('returns pipe when NO_COLOR is set', () => {
        process.env['NO_COLOR'] = '1';
        Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
        expect(detectOutputMode()).toBe('pipe');
    });
    it('returns pipe when TERM=dumb', () => {
        process.env['TERM'] = 'dumb';
        Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
        expect(detectOutputMode()).toBe('pipe');
    });
    it('returns pipe when stdout is not a TTY', () => {
        Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true });
        expect(detectOutputMode()).toBe('pipe');
    });
    it('returns static when CI is set', () => {
        process.env['CI'] = 'true';
        Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
        expect(detectOutputMode()).toBe('static');
    });
    it('returns interactive when stdout is TTY and no overrides', () => {
        Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
        expect(detectOutputMode()).toBe('interactive');
    });
    it('BIJOU_ACCESSIBLE takes priority over NO_COLOR', () => {
        process.env['BIJOU_ACCESSIBLE'] = '1';
        process.env['NO_COLOR'] = '1';
        expect(detectOutputMode()).toBe('accessible');
    });
    it('NO_COLOR takes priority over CI', () => {
        process.env['NO_COLOR'] = '1';
        process.env['CI'] = 'true';
        Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
        expect(detectOutputMode()).toBe('pipe');
    });
});
//# sourceMappingURL=tty.test.js.map