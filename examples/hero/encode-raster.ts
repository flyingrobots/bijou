import type { Surface } from '../../packages/bijou/src/index.js';
import { MonoGlyphs } from './mono-font.js';
import { rasterizeMono } from './mono-raster.js';

/** The pixel size of one terminal cell, and the colours for cells without their own. */
export const CELL = { cellWidth: 10, cellHeight: 20, foreground: '#e5e7eb', background: '#000000' };

// Text is drawn in JetBrains Mono; the glyph cache lives for the whole recording.
const GLYPHS = new MonoGlyphs(CELL.cellWidth, CELL.cellHeight);
/** One frame as RGBA pixels, with text in JetBrains Mono. */
export const rasterize = (frame: Surface): Uint8Array => rasterizeMono(frame, GLYPHS, CELL);
