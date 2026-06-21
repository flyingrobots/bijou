import { expect } from 'vitest';
import { standardBlocks } from '@flyingrobots/bijou';
import { must } from '@flyingrobots/bijou/adapters/test';

import type { FrameLike } from './dogfood-block-preview-regressions.test-support.part01.js';

function findTextStart(frame: FrameLike, text: string): { readonly x: number; readonly y: number } {
  for (let y = 0; y < frame.height; y++) {
    let row = '';
    for (let x = 0; x < frame.width; x++) {
      row += frame.get(x, y).char ?? ' ';
    }
    const x = row.indexOf(text);
    if (x >= 0) return { x, y };
  }
  throw new Error(`text not found in frame: ${text}`);
}

function findCharBefore(
  frame: FrameLike,
  y: number,
  beforeX: number,
  char: string,
): { readonly x: number; readonly y: number } {
  for (let x = beforeX - 1; x >= 0; x--) {
    if (frame.get(x, y).char === char) return { x, y };
  }
  throw new Error(`character ${char} not found before col ${String(beforeX)}`);
}

function textBefore(text: string, marker: string): string {
  const index = text.indexOf(marker);
  return index === -1 ? text : text.slice(0, index);
}

function rowContaining(rows: readonly string[], needle: string): string {
  const row = rows.find((candidate) => candidate.includes(needle));
  expect(row).toBeDefined();
  return must(row);
}

function expectBoxTitleRowCloses(row: string): void {
  const leftCorner = row.indexOf('┌');
  const rightCorner = row.lastIndexOf('┐');
  expect(leftCorner).toBeGreaterThanOrEqual(0);
  expect(rightCorner).toBeGreaterThan(leftCorner);
}

function standardBlockNamed(blockName: string) {
  const block = standardBlocks.find((candidate) => candidate.metadata.blockName === blockName);
  expect(block).toBeDefined();
  return must(block);
}

export {
  expectBoxTitleRowCloses,
  findCharBefore,
  findTextStart,
  rowContaining,
  standardBlockNamed,
  textBefore,
};
