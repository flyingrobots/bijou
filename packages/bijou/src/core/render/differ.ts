import { createSurface, type Surface, type PackedSurface, type Cell, type LayoutNode } from '../../ports/surface.js';
import type { WritePort, StylePort } from '../../ports/index.js';
import { ANSI_OSC8_RE, graphemeClusterWidth, stripAnsi, segmentGraphemes } from '../text/index.js';
import {
  CELL_STRIDE,
  OFF_FG_R,
  FLAG_BOLD, FLAG_DIM, FLAG_STRIKETHROUGH, FLAG_INVERSE,
  FLAG_FG_SET, FLAG_BG_SET, FLAG_EMPTY,
  FLAG_DASHED,
  SIDE_TABLE_THRESHOLD,
  decodeChar, parseHex,
} from './packed-cell.js';

const EMPTY_CELL: Cell = { char: ' ', empty: true };
const EMPTY_MODIFIERS: readonly string[] = [];

function isPackedSurface(s: Surface): s is PackedSurface {
  return 'buffer' in s && s.buffer instanceof Uint8Array;
}

function hasVisibleStyle(cell: Cell): boolean {
  return cell.fg !== undefined
    || cell.bg !== undefined
    || (cell.modifiers?.length ?? 0) > 0;
}

/**
 * Convert a multi-line string into a Surface.
 *
 * This is a plain-text bridge. It strips ANSI and treats all characters
 * as the default style.
 */
export function stringToSurface(text: string, width: number, height: number): Surface {
  const surface = createSurface(width, height);
  const plainText = stripAnsi(text);
  const lines = plainText.split(/\r?\n/);

  for (let y = 0; y < Math.min(height, lines.length); y++) {
    const line = lines[y]!;
    const gs = segmentGraphemes(line);
    let x = 0;
    for (const char of gs) {
      if (x >= width) break;
      x += writeSurfaceGrapheme(surface, x, y, char);
    }
  }

  return surface;
}

/**
 * Robust ANSI-aware string to Surface conversion.
 */
export function parseAnsiToSurface(text: string, width: number, height: number): Surface {
  const surface = createSurface(width, height);
  const lines = text.replace(ANSI_OSC8_RE, '').split(/\r?\n/);

  const ANSI_RE = /\x1b\[([0-9;]*)m/g;

  for (let y = 0; y < Math.min(height, lines.length); y++) {
    const line = lines[y]!;
    let x = 0;
    
    let currentFg: string | undefined;
    let currentBg: string | undefined;
    let currentMods = new Set<string>();

    const matches = Array.from(line.matchAll(ANSI_RE));
    let lastIndex = 0;

    for (const match of matches) {
      const matchIndex = match.index!;
      const part = line.slice(lastIndex, matchIndex);
      const gs = segmentGraphemes(part);
      for (const char of gs) {
        if (x >= width) break;
        x += writeSurfaceGrapheme(surface, x, y, char, {
          fg: currentFg,
          bg: currentBg,
          modifiers: Array.from(currentMods),
        });
      }

      const codeStr = match[1]!;
      if (codeStr === '0' || codeStr === '') {
        currentFg = undefined;
        currentBg = undefined;
        currentMods.clear();
      } else {
        const parts = codeStr.split(';');
        let i = 0;
        while (i < parts.length) {
          const code = parts[i]!;
          if (code === '1') currentMods.add('bold');
          else if (code === '2') currentMods.add('dim');
          else if (code === '3') currentMods.add('italic');
          else if (code === '4') currentMods.add('underline');
          else if (code === '7') currentMods.add('inverse');
          else if (code === '9') currentMods.add('strike');
          else if (code === '22') { currentMods.delete('bold'); currentMods.delete('dim'); }
          else if (code === '23') currentMods.delete('italic');
          else if (code === '24') currentMods.delete('underline');
          else if (code === '27') currentMods.delete('inverse');
          else if (code === '29') currentMods.delete('strike');
          else if (code === '38' && parts[i+1] === '2') {
            // Truecolor FG: 38;2;R;G;B
            const r = parseInt(parts[i+2]!, 10).toString(16).padStart(2, '0');
            const g = parseInt(parts[i+3]!, 10).toString(16).padStart(2, '0');
            const b = parseInt(parts[i+4]!, 10).toString(16).padStart(2, '0');
            currentFg = '#' + r + g + b;
            i += 4;
          } else if (code === '48' && parts[i+1] === '2') {
            // Truecolor BG: 48;2;R;G;B
            const r = parseInt(parts[i+2]!, 10).toString(16).padStart(2, '0');
            const g = parseInt(parts[i+3]!, 10).toString(16).padStart(2, '0');
            const b = parseInt(parts[i+4]!, 10).toString(16).padStart(2, '0');
            currentBg = '#' + r + g + b;
            i += 4;
          }
          i++;
        }
      }
      
      lastIndex = matchIndex + match[0].length;
    }

    const remaining = line.slice(lastIndex);
    const gs = segmentGraphemes(remaining);
    for (const char of gs) {
      if (x >= width) break;
      x += writeSurfaceGrapheme(surface, x, y, char, {
        fg: currentFg,
        bg: currentBg,
        modifiers: Array.from(currentMods),
      });
    }
  }
  return surface;
}

function writeSurfaceGrapheme(
  surface: Surface,
  x: number,
  y: number,
  char: string,
  style?: Pick<Cell, 'fg' | 'bg' | 'modifiers'>,
): number {
  if (x >= surface.width) return 0;

  const width = Math.max(1, graphemeClusterWidth(char));

  if (isPackedSurface(surface) && (style?.fg || style?.bg)) {
    const fg = style?.fg ? parseHex(style.fg) : undefined;
    let fR = -1, fG = 0, fB = 0;
    if (fg) { fR = fg[0]; fG = fg[1]; fB = fg[2]; }
    const bg = style?.bg ? parseHex(style.bg) : undefined;
    let bR = -1, bG = 0, bB = 0;
    if (bg) { bR = bg[0]; bG = bg[1]; bB = bg[2]; }
    surface.setRGB(x, y, char, fR, fG, fB, bR, bG, bB);
    for (let offset = 1; offset < width && x + offset < surface.width; offset++) {
      surface.setRGB(x + offset, y, '', fR, fG, fB, bR, bG, bB);
    }
  } else {
    surface.set(x, y, { char, ...style, empty: false });
    for (let offset = 1; offset < width && x + offset < surface.width; offset++) {
      surface.set(x + offset, y, { char: '', ...style, empty: false });
    }
  }

  return width;
}

/**
 * Convert a Surface into a multi-line string with ANSI escape codes.
 *
 * This is an explicit bridge for string-first APIs and terminal writes.
 *
 * @param surface - The surface to convert.
 * @param style - The style port to use for color resolution.
 * @returns A string representation of the surface.
 */
export function surfaceToString(surface: Surface, style: StylePort): string {
  const lines: string[] = [];
  for (let y = 0; y < surface.height; y++) {
    let line = '';
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      const token = {
        hex: cell.fg,
        bg: cell.bg,
        modifiers: cell.modifiers as any,
      };
      line += style.styled(token as any, cell.char);
    }
    lines.push(line);
  }
  return lines.join('\n');
}

/**
 * Paint a LayoutNode tree onto a Surface.
 * 
 * @param target - The surface to paint onto.
 * @param node - The root layout node to paint.
 */
export function paintLayoutNode(target: Surface, node: LayoutNode): void {
  if (node.surface) {
    target.blit(node.surface, node.rect.x, node.rect.y);
  }

  for (const child of node.children) {
    paintLayoutNode(target, child);
  }
}

/**
 * Compare two cells for equality (content and style).
 */
export function isSameCell(a: Cell, b: Cell): boolean {
  if (a === b) return true;
  if (a.char !== b.char) return false;
  if (a.fg !== b.fg) return false;
  if (a.bg !== b.bg) return false;
  if (a.empty !== b.empty) return false;
  
  const aMods = a.modifiers ?? [];
  const bMods = b.modifiers ?? [];
  if (aMods === bMods) return true;
  if (aMods.length !== bMods.length) return false;
  for (let i = 0; i < aMods.length; i++) {
    if (aMods[i] !== bMods[i]) return false;
  }
  
  return true;
}

/**
 * Move the terminal cursor to (x, y) using CUP (Cursor Position) escape code.
 * Coordinates are 0-based in Bijou, but 1-based in ANSI.
 */
function moveCursor(x: number, y: number): string {
  return `\x1b[${y + 1};${x + 1}H`;
}

/**
 * Diff two surfaces and write the minimal set of changes to the WritePort.
 *
 * Optimizations:
 * 1. Skips identical cells.
 * 2. Minimizes CUP (move cursor) commands by detecting contiguous changes.
 * 3. Batches cells with identical styles to minimize SGR codes and keep strings contiguous.
 *
 * When both surfaces are {@link PackedSurface}, the caller owns a pooled
 * `outBuf`, and the IO port implements {@link WritePort.writeBytes}, the
 * composed frame is UTF-8 encoded into the supplied buffer once and
 * handed off via `writeBytes` instead of `write(string)`. This lets the
 * TUI runtime own the output allocation and bypass the implicit
 * string→UTF-8 conversion inside the underlying stream.
 *
 * Callers without an `outBuf` (tests, bench scenarios, simple drivers)
 * fall through to the legacy `io.write(string)` path with no overhead.
 *
 * @param current - The surface currently on the terminal.
 * @param target  - The desired surface state.
 * @param io      - The port to write ANSI codes to.
 * @param style   - The port to resolve cell styling.
 * @param outBuf  - Optional pooled byte buffer for the packed byte path.
 */
export function renderDiff(
  current: Surface,
  target: Surface,
  io: WritePort,
  style: StylePort,
  outBuf?: Uint8Array,
): void {
  // Use packed byte path when both surfaces have buffers
  if (isPackedSurface(target) && isPackedSurface(current)) {
    renderDiffPacked(current, target, io, style, outBuf);
    return;
  }
  renderDiffCells(current, target, io, style);
}

// ── Packed byte-comparison differ ───────────────────────

/**
 * Empty cell encoded as packed bytes for out-of-bounds boundary comparison.
 * Must match what createSurface produces for `{ char: ' ', empty: true }`.
 * Static shared buffer — do not mutate.
 */
const EMPTY_PACKED = new Uint8Array(CELL_STRIDE);
EMPTY_PACKED[0] = 0x20; // char: space (0x0020 LE)
EMPTY_PACKED[8] = FLAG_EMPTY; // flags: empty bit set
EMPTY_PACKED[9] = 63; // alpha: opacity=63 (1.0), fg/bg not present

function packedBytesEqual(
  a: Uint8Array, aOff: number,
  b: Uint8Array, bOff: number,
): boolean {
  for (let i = 0; i < CELL_STRIDE; i++) {
    if (a[aOff + i] !== b[bOff + i]) return false;
  }
  return true;
}

function packedStyleBytesEqual(
  a: Uint8Array, aOff: number,
  b: Uint8Array, bOff: number,
): boolean {
  // Compare from OFF_FG_R through end (fg, bg, flags, alpha) — skip char
  for (let i = OFF_FG_R; i < CELL_STRIDE; i++) {
    if (a[aOff + i] !== b[bOff + i]) return false;
  }
  return true;
}

function packedHasVisibleStyle(buf: Uint8Array, off: number): boolean {
  const alpha = buf[off + 9]!;
  return (alpha & (FLAG_FG_SET | FLAG_BG_SET)) !== 0
    || (buf[off + 8]! & ~FLAG_EMPTY) !== 0;
}

// --- Direct ANSI byte emission ─────────────────────────
//
// II-4: the differ no longer builds SGR/cursor/batch strings and
// concatenates them. It writes raw UTF-8 bytes directly into the
// pooled output buffer using the helpers below. The legacy
// `sgrCache` / `buildSgr` / `styleCacheKey` machinery is gone — the
// direct byte writers are fast enough that caching hash-indexed
// strings is pure overhead.

// Reusable UTF-8 encoder/decoder for the byte-output path. encodeInto
// writes UTF-8 directly into a target view without an intermediate
// Uint8Array; the decoder is only used on the fallback path where the
// IO port lacks writeBytes (tests, mock sinks).
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8');

// Lazy module-level scratch buffer used when the caller does not pass
// an outBuf (tests, bench scenarios, simple drivers). Grown once to
// match the largest surface seen and reused thereafter.
let scratchOutBuf: Uint8Array | null = null;

/** Upper bound on bytes the differ may emit per surface cell. */
const SCRATCH_BYTES_PER_CELL = 96;
/** Fixed slack on top of the scratch cell budget. */
const SCRATCH_SLACK = 8192;

// ANSI byte constants are emitted as inline `buf[off++] = …` writes in
// writeCursorBytes / writeSgrFromBufBytes. TypedArray.set has per-call
// setup cost that dominates for 4-byte sequences, so inline writes beat
// pre-allocated Uint8Array constants in the hot path.

/**
 * Write an unsigned integer (0–999) as ASCII digits. Returns new offset.
 * Covers every value a cursor coordinate or RGB component can take.
 */
function writeDecimal(buf: Uint8Array, off: number, n: number): number {
  if (n >= 100) {
    const h = (n / 100) | 0;
    const rem = n - h * 100;
    const t = (rem / 10) | 0;
    buf[off] = 0x30 + h;
    buf[off + 1] = 0x30 + t;
    buf[off + 2] = 0x30 + (rem - t * 10);
    return off + 3;
  }
  if (n >= 10) {
    const t = (n / 10) | 0;
    buf[off] = 0x30 + t;
    buf[off + 1] = 0x30 + (n - t * 10);
    return off + 2;
  }
  buf[off] = 0x30 + n;
  return off + 1;
}

/** Write `\x1b[Y;XH` (CUP) with 1-based coordinates. */
function writeCursorBytes(buf: Uint8Array, off: number, x: number, y: number): number {
  buf[off] = 0x1b;        // ESC
  buf[off + 1] = 0x5b;    // [
  off += 2;
  off = writeDecimal(buf, off, y + 1);
  buf[off++] = 0x3b;      // ;
  off = writeDecimal(buf, off, x + 1);
  buf[off++] = 0x48;      // H
  return off;
}

/**
 * Emit the full SGR prelude for the style bytes at `srcOff` into `buf`.
 * Matches the legacy `buildSgr()` emission order byte-for-byte: reset,
 * optional truecolor FG, optional truecolor BG, modifier flags (bold,
 * dim, strike, inverse in that order), optional underline.
 *
 * Short (≤6 byte) byte sequences are inlined via direct index writes
 * rather than `buf.set(CONST, off)` — the call overhead on a tiny
 * TypedArray.set outweighs the memcpy for 4-byte bursts in V8.
 */
function writeSgrFromBufBytes(
  buf: Uint8Array, off: number,
  srcBuf: Uint8Array, srcOff: number,
): number {
  // Leading reset: \x1b[0m — 4 inline byte writes.
  buf[off] = 0x1b;
  buf[off + 1] = 0x5b;
  buf[off + 2] = 0x30;
  buf[off + 3] = 0x6d;
  off += 4;

  const flags = srcBuf[srcOff + 8]!;
  const alpha = srcBuf[srcOff + 9]!;

  if (alpha & FLAG_FG_SET) {
    // \x1b[38;2;R;G;Bm — 7-byte prefix inlined as individual writes.
    buf[off] = 0x1b;
    buf[off + 1] = 0x5b;
    buf[off + 2] = 0x33;
    buf[off + 3] = 0x38;
    buf[off + 4] = 0x3b;
    buf[off + 5] = 0x32;
    buf[off + 6] = 0x3b;
    off += 7;
    off = writeDecimal(buf, off, srcBuf[srcOff + OFF_FG_R]!);
    buf[off++] = 0x3b;
    off = writeDecimal(buf, off, srcBuf[srcOff + OFF_FG_R + 1]!);
    buf[off++] = 0x3b;
    off = writeDecimal(buf, off, srcBuf[srcOff + OFF_FG_R + 2]!);
    buf[off++] = 0x6d;
  }

  if (alpha & FLAG_BG_SET) {
    // \x1b[48;2;R;G;Bm
    buf[off] = 0x1b;
    buf[off + 1] = 0x5b;
    buf[off + 2] = 0x34;
    buf[off + 3] = 0x38;
    buf[off + 4] = 0x3b;
    buf[off + 5] = 0x32;
    buf[off + 6] = 0x3b;
    off += 7;
    off = writeDecimal(buf, off, srcBuf[srcOff + 5]!);
    buf[off++] = 0x3b;
    off = writeDecimal(buf, off, srcBuf[srcOff + 6]!);
    buf[off++] = 0x3b;
    off = writeDecimal(buf, off, srcBuf[srcOff + 7]!);
    buf[off++] = 0x6d;
  }

  // Modifier flags — 4-byte sequences inlined.
  if (flags & FLAG_BOLD) {
    buf[off] = 0x1b;  buf[off + 1] = 0x5b;  buf[off + 2] = 0x31;  buf[off + 3] = 0x6d;  off += 4;
  }
  if (flags & FLAG_DIM) {
    buf[off] = 0x1b;  buf[off + 1] = 0x5b;  buf[off + 2] = 0x32;  buf[off + 3] = 0x6d;  off += 4;
  }
  if (flags & FLAG_STRIKETHROUGH) {
    buf[off] = 0x1b;  buf[off + 1] = 0x5b;  buf[off + 2] = 0x39;  buf[off + 3] = 0x6d;  off += 4;
  }
  if (flags & FLAG_INVERSE) {
    buf[off] = 0x1b;  buf[off + 1] = 0x5b;  buf[off + 2] = 0x37;  buf[off + 3] = 0x6d;  off += 4;
  }

  const uStyle = (flags >> 4) & 0x03;
  if (uStyle === 1) {
    // \x1b[4m
    buf[off] = 0x1b;  buf[off + 1] = 0x5b;  buf[off + 2] = 0x34;  buf[off + 3] = 0x6d;  off += 4;
  } else if (uStyle === 2) {
    // \x1b[4:3m
    buf[off] = 0x1b;  buf[off + 1] = 0x5b;  buf[off + 2] = 0x34;
    buf[off + 3] = 0x3a;  buf[off + 4] = 0x33;  buf[off + 5] = 0x6d;
    off += 6;
  } else if (uStyle === 3) {
    // \x1b[4:4m (dotted) or \x1b[4:5m (dashed)
    buf[off] = 0x1b;  buf[off + 1] = 0x5b;  buf[off + 2] = 0x34;  buf[off + 3] = 0x3a;
    buf[off + 4] = (flags & FLAG_DASHED) ? 0x35 : 0x34;
    buf[off + 5] = 0x6d;
    off += 6;
  }

  return off;
}

/**
 * Write one packed cell's character into the output buffer as UTF-8.
 * ASCII and BMP code points are encoded inline; only side-table graphemes
 * (multi-codepoint clusters) require a `TextEncoder.encodeInto` call.
 */
function writeCharBytes(
  buf: Uint8Array, off: number,
  srcBuf: Uint8Array, srcOff: number,
  sideTable: readonly string[],
): number {
  const code = srcBuf[srcOff]! | (srcBuf[srcOff + 1]! << 8);

  if (code < 0x80) {
    // ASCII fast path
    buf[off] = code;
    return off + 1;
  }

  if (code < SIDE_TABLE_THRESHOLD) {
    // BMP code point: 0x0080..0x07ff → 2 bytes, 0x0800..0xffff → 3 bytes.
    if (code < 0x800) {
      buf[off] = 0xc0 | (code >> 6);
      buf[off + 1] = 0x80 | (code & 0x3f);
      return off + 2;
    }
    buf[off] = 0xe0 | (code >> 12);
    buf[off + 1] = 0x80 | ((code >> 6) & 0x3f);
    buf[off + 2] = 0x80 | (code & 0x3f);
    return off + 3;
  }

  // Side-table index — multi-codepoint grapheme cluster.
  const grapheme = sideTable[code - SIDE_TABLE_THRESHOLD] ?? '';
  const { written } = textEncoder.encodeInto(grapheme, buf.subarray(off));
  return off + written;
}

/**
 * Semantic packed-cell equality across two buffers with independent side tables.
 * Raw bytes are compared first; if they match and the char is a side-table
 * index, the actual grapheme strings are verified.
 */
function packedCellsSemanticallyEqual(
  aBuf: Uint8Array, aOff: number, aSide: readonly string[],
  bBuf: Uint8Array, bOff: number, bSide: readonly string[],
): boolean {
  if (!packedBytesEqual(aBuf, aOff, bBuf, bOff)) return false;
  const aChar = aBuf[aOff]! | (aBuf[aOff + 1]! << 8);
  if (aChar < SIDE_TABLE_THRESHOLD) return true;
  const bChar = bBuf[bOff]! | (bBuf[bOff + 1]! << 8);
  return aChar === bChar && decodeChar(aChar, aSide) === decodeChar(bChar, bSide);
}

/**
 * Worst-case byte budget at the start of a new batch, including the
 * batch's entire emission: cursor (~10) + SGR preamble (~70) + up to
 * `width` cells of chars (worst case ~32 bytes each for side-table
 * emoji clusters) + trailing reset (4). A row can have at most one
 * batch per dirty run; reserving this much at batch start means the
 * inner char-write loop never needs a per-cell capacity check.
 *
 * For a 220-wide terminal the worst case is ~7160 bytes (220 × 32 +
 * 96 + 4). We round up to 8192 so the math is easy and batches with
 * an unusual mix of large graphemes still fit.
 */
const BATCH_PREAMBLE_BUDGET = 8192;

function renderDiffPacked(
  current: PackedSurface,
  target: PackedSurface,
  io: WritePort,
  _style: StylePort,
  outBuf?: Uint8Array,
): void {
  const width = target.width;
  const height = target.height;
  const tBuf = target.buffer;
  const cBuf = current.buffer;
  const cWidth = current.width;
  const cHeight = current.height;
  const tSide = target.sideTable;
  const cSide = current.sideTable;

  // Render-dirty bitmap fast path. Cells that weren't mutated since
  // the last clear() in EITHER surface are guaranteed unchanged on
  // the buffer level, so we can skip them entirely. We walk the union
  // of the two bitmaps because:
  //   - Bits in target.renderDirtyWords = cells the user painted this frame
  //   - Bits in current.renderDirtyWords = cells the user painted last frame
  //     (which may now need to be erased if not painted this frame)
  // The union covers both "new content" and "needs erasure" cases.
  const tDirty = target.renderDirtyWords;
  const cDirty = current.renderDirtyWords;
  const cellCount = width * height;
  const wordCount = (cellCount + 31) >>> 5;

  // Early out: if no cells in EITHER surface are dirty, there is
  // nothing to emit. This is the diff-static / unchanged-frame case
  // and should be near-zero cost.
  let anyDirty = false;
  // Both bitmaps may have different lengths if width/height differ,
  // but in practice they're the same. Walk min(both).
  const tWords = Math.min(wordCount, tDirty.length);
  const cWords = Math.min(wordCount, cDirty.length);
  const minWords = Math.min(tWords, cWords);
  for (let w = 0; w < minWords; w++) {
    if ((tDirty[w]! | cDirty[w]!) !== 0) {
      anyDirty = true;
      break;
    }
  }
  if (!anyDirty) {
    // Check tail words from whichever bitmap is longer
    for (let w = minWords; w < tWords && !anyDirty; w++) {
      if (tDirty[w]! !== 0) anyDirty = true;
    }
    for (let w = minWords; w < cWords && !anyDirty; w++) {
      if (cDirty[w]! !== 0) anyDirty = true;
    }
  }
  if (!anyDirty) {
    return;
  }

  // Acquire the pooled output buffer. The runtime supplies one sized
  // against the current viewport; all other callers land on the
  // module-level scratch buffer (sized against the live surface and
  // reused across calls).
  let buf: Uint8Array;
  if (outBuf !== undefined) {
    buf = outBuf;
  } else {
    const needed = cellCount * SCRATCH_BYTES_PER_CELL + SCRATCH_SLACK;
    if (scratchOutBuf === null || scratchOutBuf.length < needed) {
      scratchOutBuf = new Uint8Array(needed);
    }
    buf = scratchOutBuf;
  }
  let off = 0;

  // Flush the pending bytes to the IO port and reset the cursor to
  // the start of the pool. Direct `writeBytes` handoff on the Node
  // stdout path; TextDecoder fallback for mock sinks that only carry
  // a string-level `write`.
  const flush = (): void => {
    if (off === 0) return;
    if (io.writeBytes !== undefined) {
      io.writeBytes(buf, off);
    } else {
      io.write(textDecoder.decode(buf.subarray(0, off)));
    }
    off = 0;
  };

  let cursorX = -1;
  let cursorY = -1;

  // Fast path: skip expensive side-table string verification when neither
  // surface has any side-table entries (the common case — no emoji/astral).
  const needsSideTableCheck = tSide.length > 0 || cSide.length > 0;

  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x < width) {
      const tIdx = y * width + x;

      // Per-cell dirty skip: if neither surface marked this cell as
      // touched, the bytes are guaranteed identical and there is
      // nothing to emit. Skip it without doing the byte compare.
      const wordIdx = tIdx >>> 5;
      const bitMask = 1 << (tIdx & 31);
      const cellDirty =
        ((wordIdx < tDirty.length ? tDirty[wordIdx]! : 0) & bitMask) !== 0
        || ((wordIdx < cDirty.length ? cDirty[wordIdx]! : 0) & bitMask) !== 0;
      if (!cellDirty) {
        x++;
        continue;
      }

      const tOff = tIdx * CELL_STRIDE;
      const inBounds = y < cHeight && x < cWidth;
      const cOff = inBounds ? (y * cWidth + x) * CELL_STRIDE : -1;

      const same = inBounds
        ? (needsSideTableCheck
            ? packedCellsSemanticallyEqual(tBuf, tOff, tSide, cBuf, cOff, cSide)
            : packedBytesEqual(tBuf, tOff, cBuf, cOff))
        : packedBytesEqual(tBuf, tOff, EMPTY_PACKED, 0);

      if (same) {
        x++;
        continue;
      }

      // Flush if the batch preamble (cursor + SGR) cannot fit contiguously.
      if (off + BATCH_PREAMBLE_BUDGET > buf.length) {
        flush();
      }

      if (x !== cursorX || y !== cursorY) {
        off = writeCursorBytes(buf, off, x, y);
      }

      const hasStyle = packedHasVisibleStyle(tBuf, tOff);
      if (hasStyle) {
        off = writeSgrFromBufBytes(buf, off, tBuf, tOff);
      }

      let batchX = x;
      while (batchX < width) {
        const bIdx = y * width + batchX;
        const bOff = bIdx * CELL_STRIDE;

        // Style check: does this cell match the batch leader's style?
        if (batchX > x && !packedStyleBytesEqual(tBuf, tOff, tBuf, bOff)) {
          break;
        }

        // Cell changed check
        const bInBounds = y < cHeight && batchX < cWidth;
        const bcOff = bInBounds ? (y * cWidth + batchX) * CELL_STRIDE : -1;
        const cellsMatch = bInBounds
          ? (needsSideTableCheck
              ? packedCellsSemanticallyEqual(tBuf, bOff, tSide, cBuf, bcOff, cSide)
              : packedBytesEqual(tBuf, bOff, cBuf, bcOff))
          : packedBytesEqual(tBuf, bOff, EMPTY_PACKED, 0);

        if (cellsMatch) break;

        off = writeCharBytes(buf, off, tBuf, bOff, tSide);
        batchX++;
      }

      // Trailing reset after styled batch — matches legacy emission.
      // 4-byte inline write, same as the leading reset inside writeSgrFromBufBytes.
      if (hasStyle) {
        buf[off] = 0x1b;
        buf[off + 1] = 0x5b;
        buf[off + 2] = 0x30;
        buf[off + 3] = 0x6d;
        off += 4;
      }

      cursorX = batchX;
      cursorY = y;
      x = batchX;
    }
  }

  flush();
}

// ── Legacy cell-based differ (fallback) ─────────────────

function renderDiffCells(
  current: Surface,
  target: Surface,
  io: WritePort,
  style: StylePort,
): void {
  const width = target.width;
  const height = target.height;
  const targetCells = target.cells;
  const currentCells = current.cells;
  const currentWidth = current.width;
  const currentHeight = current.height;

  let output = '';
  let cursorX = -1;
  let cursorY = -1;
  const token: { hex?: string; bg?: string; modifiers?: Cell['modifiers'] } = {};

  for (let y = 0; y < height; y++) {
    const targetRowOffset = y * width;
    const currentRowOffset = y * currentWidth;
    let x = 0;
    while (x < width) {
      const targetCell = targetCells[targetRowOffset + x]!;
      const currentCell = y < currentHeight && x < currentWidth
        ? currentCells[currentRowOffset + x]!
        : EMPTY_CELL;

      const targetMods = targetCell.modifiers ?? EMPTY_MODIFIERS;
      const currentMods = currentCell.modifiers ?? EMPTY_MODIFIERS;
      let sameCell = targetCell === currentCell
        || (
          targetCell.char === currentCell.char
          && targetCell.fg === currentCell.fg
          && targetCell.bg === currentCell.bg
          && targetCell.empty === currentCell.empty
          && targetMods.length === currentMods.length
        );
      if (sameCell && targetCell !== currentCell && targetMods !== currentMods) {
        for (let i = 0; i < targetMods.length; i++) {
          if (targetMods[i] !== currentMods[i]) {
            sameCell = false;
            break;
          }
        }
      }

      if (sameCell) {
        x++;
        continue;
      }

      if (x !== cursorX || y !== cursorY) {
        output += moveCursor(x, y);
      }

      let batchX = x;
      let batchText = '';
      const batchStyleMods = targetMods;
      while (batchX < width) {
        const c = targetCells[targetRowOffset + batchX]!;
        const curr = y < currentHeight && batchX < currentWidth
          ? currentCells[currentRowOffset + batchX]!
          : EMPTY_CELL;

        if (batchX > x) {
          const cellMods = c.modifiers ?? EMPTY_MODIFIERS;
          let sameStyle = c === targetCell
            || (
              c.fg === targetCell.fg
              && c.bg === targetCell.bg
              && cellMods.length === batchStyleMods.length
            );
          if (sameStyle && c !== targetCell && cellMods !== batchStyleMods) {
            for (let i = 0; i < cellMods.length; i++) {
              if (cellMods[i] !== batchStyleMods[i]) {
                sameStyle = false;
                break;
              }
            }
          }
          if (!sameStyle) break;
        }

        const cellMods = c.modifiers ?? EMPTY_MODIFIERS;
        const currMods = curr.modifiers ?? EMPTY_MODIFIERS;
        let cellsMatch = c === curr
          || (
            c.char === curr.char
            && c.fg === curr.fg
            && c.bg === curr.bg
            && c.empty === curr.empty
            && cellMods.length === currMods.length
          );
        if (cellsMatch && c !== curr && cellMods !== currMods) {
          for (let i = 0; i < cellMods.length; i++) {
            if (cellMods[i] !== currMods[i]) {
              cellsMatch = false;
              break;
            }
          }
        }
        if (cellsMatch) break;

        batchText += c.char;
        batchX++;
      }

      if (hasVisibleStyle(targetCell)) {
        token.hex = targetCell.fg;
        token.bg = targetCell.bg;
        token.modifiers = targetCell.modifiers as any;
        output += style.styled(token as any, batchText);
      } else {
        output += batchText;
      }

      const batchWidth = batchX - x;
      cursorX = x + batchWidth;
      cursorY = y;
      x = batchX;
    }
  }

  if (output.length > 0) {
    io.write(output);
  }
}
