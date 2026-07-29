import { describe, it } from 'vitest';
import {
  MAX_PACKED_BIJOU_CELLS,
  MAX_PACKED_BIJOU_DIMENSION,
} from '@flyingrobots/bijou';
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
    expectReceiptError(widthOverflow, 'invalid-dimension', '$.widthCells');

    const heightOverflow = validPackedCellsInput();
    heightOverflow.widthCells = 2;
    heightOverflow.heightCells = Number.MAX_SAFE_INTEGER;
    expectReceiptError(heightOverflow, 'invalid-dimension', '$.heightCells');

    const excessiveWidth = validPackedCellsInput();
    excessiveWidth.widthCells = MAX_PACKED_BIJOU_CELLS + 1;
    expectReceiptError(excessiveWidth, 'invalid-dimension', '$.widthCells');

    const excessiveHeight = validPackedCellsInput();
    excessiveHeight.heightCells = MAX_PACKED_BIJOU_CELLS + 1;
    expectReceiptError(excessiveHeight, 'invalid-dimension', '$.heightCells');

    const unrenderableWidth = validPackedCellsInput();
    unrenderableWidth.widthCells = MAX_PACKED_BIJOU_DIMENSION + 1;
    unrenderableWidth.heightCells = 1;
    expectReceiptError(
      unrenderableWidth,
      'invalid-dimension',
      '$.widthCells',
    );

    const unrenderableHeight = validPackedCellsInput();
    unrenderableHeight.widthCells = 1;
    unrenderableHeight.heightCells = MAX_PACKED_BIJOU_DIMENSION + 1;
    expectReceiptError(
      unrenderableHeight,
      'invalid-dimension',
      '$.heightCells',
    );
  });
});
