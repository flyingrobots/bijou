/**
 * Shared bench utilities — counting sink, type guards, and style stubs
 * used across diff and paint scenarios.
 */

import type { WritePort, StylePort, Surface, PackedSurface } from '@flyingrobots/bijou';

/** WritePort that counts writes and bytes without producing real output. */
export interface CountingSink extends WritePort {
  writes: number;
  bytesWritten: number;
}

/** Type guard: does this Surface have a packed byte buffer? */
export function isPacked(s: Surface): s is PackedSurface {
  return 'buffer' in (s as { buffer?: unknown }) && (s as { buffer?: unknown }).buffer instanceof Uint8Array;
}

/**
 * Create a counting sink that implements both `write(string)` and
 * `writeBytes(buf, len)`. The byte path is what the production
 * differ uses; the string path is the fallback for mock IO.
 */
export function createSink(): CountingSink {
  return {
    writes: 0,
    bytesWritten: 0,
    write(text: string) {
      this.writes += 1;
      this.bytesWritten += text.length;
    },
    writeBytes(_buf: Uint8Array, len: number) {
      this.writes += 1;
      this.bytesWritten += len;
    },
    writeError() {},
  };
}

/**
 * Minimal StylePort stub. The packed differ bypasses StylePort for
 * the byte path, but the interface is still required. This stub
 * returns all text unchanged.
 */
export const stubStyle: StylePort = {
  styled(_token: unknown, text: string): string { return text; },
  rgb(_r: number, _g: number, _b: number, text: string): string { return text; },
  hex(_color: string, text: string): string { return text; },
  bgRgb(_r: number, _g: number, _b: number, text: string): string { return text; },
  bgHex(_color: string, text: string): string { return text; },
  bold(text: string): string { return text; },
};
