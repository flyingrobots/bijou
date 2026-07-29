/**
 * Block-level and inline markdown parsing, plus word wrapping.
 *
 * Two-pass parser: block-level (line-by-line), then inline within each block.
 * Reuses `hyperlink()` for link rendering in styled mode.
 */

export type { BlockType } from './markdown-parse.part01.js';
export { wordWrap } from './markdown-parse.part01.js';
export { parseBlocks } from './markdown-parse.part02.js';
export { parseInline } from './markdown-parse.part03.js';
