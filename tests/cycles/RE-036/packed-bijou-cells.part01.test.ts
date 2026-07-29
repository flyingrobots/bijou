import { describe, expect, it } from 'vitest';
import {
  adaptPackedBijouCellsToSurface,
  isPackedSurface,
  parsePackedBijouCellsReceipt,
} from '@flyingrobots/bijou';
import {
  arrayField,
  validPackedCellsInput,
} from './packed-bijou-cells.test-support.js';

describe('RE-036 packed-bijou-cells/1 valid receipt', () => {
  it('parses a checked-in JSON receipt without mutating its input', () => {
    const input = validPackedCellsInput();
    const before = JSON.stringify(input);
    const receipt = parsePackedBijouCellsReceipt(input);

    expect(receipt.receiptVersion).toBe('packed-bijou-cells/1');
    expect(receipt.widthCells).toBe(2);
    expect(receipt.heightCells).toBe(2);
    expect(receipt.scene.cellNodeIds).toHaveLength(4);
    expect(JSON.stringify(input)).toBe(before);
    expect(receipt.bytes).not.toBe(arrayField(input, 'bytes'));
  });

  it('adapts bytes and side-table order exactly into a packed Surface', () => {
    const input = validPackedCellsInput();
    const expectedBytes = [...arrayField(input, 'bytes')];
    const expectedSideTable = [...arrayField(input, 'sideTable')];
    const receipt = parsePackedBijouCellsReceipt(input);
    const surface = adaptPackedBijouCellsToSurface(input);

    expect(isPackedSurface(surface)).toBe(true);
    expect(surface.width).toBe(receipt.widthCells);
    expect(surface.height).toBe(receipt.heightCells);
    expect(Array.from(surface.buffer)).toEqual(expectedBytes);
    expect(surface.sideTable).toEqual(expectedSideTable);
    expect(surface.get(0, 0)).toMatchObject({
      char: 'A',
      fgRGB: [255, 64, 32],
      empty: false,
    });
    expect(surface.get(1, 0).char).toBe('é');
    expect(surface.get(0, 1).char).toBe('');
    expect(surface.get(1, 1)).toMatchObject({
      char: ' ',
      empty: true,
      opacity: 0,
    });
  });
});
