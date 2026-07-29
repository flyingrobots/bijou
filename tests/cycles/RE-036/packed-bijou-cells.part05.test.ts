import { describe, it } from 'vitest';
import { MAX_PACKED_BIJOU_CELLS } from '@flyingrobots/bijou';
import {
  expectReceiptError,
  validPackedCellsInput,
} from './packed-bijou-cells.test-support.js';

describe('RE-036 packed-bijou-cells/1 dimensions', () => {
  it('rejects non-positive, fractional, unsafe, and overflowing dimensions', () => {
    for (const value of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      const widthInput = validPackedCellsInput();
      widthInput.widthCells = value;
      expectReceiptError(widthInput, 'invalid-dimension', '$.widthCells');

      const heightInput = validPackedCellsInput();
      heightInput.heightCells = value;
      expectReceiptError(heightInput, 'invalid-dimension', '$.heightCells');
    }

    const widthOverflow = validPackedCellsInput();
    widthOverflow.widthCells = Number.MAX_SAFE_INTEGER;
    widthOverflow.heightCells = 2;
    expectReceiptError(widthOverflow, 'invalid-dimension', '$');

    const heightOverflow = validPackedCellsInput();
    heightOverflow.widthCells = 2;
    heightOverflow.heightCells = Number.MAX_SAFE_INTEGER;
    expectReceiptError(heightOverflow, 'invalid-dimension', '$');

    const excessiveWidth = validPackedCellsInput();
    excessiveWidth.widthCells = MAX_PACKED_BIJOU_CELLS + 1;
    expectReceiptError(excessiveWidth, 'invalid-dimension', '$');

    const excessiveHeight = validPackedCellsInput();
    excessiveHeight.heightCells = MAX_PACKED_BIJOU_CELLS + 1;
    expectReceiptError(excessiveHeight, 'invalid-dimension', '$');
  });
});
