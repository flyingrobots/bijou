import { describe, it } from 'vitest';
import { MAX_PACKED_BIJOU_GLYPH_CODE_UNITS } from '@flyingrobots/bijou';
import {
  arrayField,
  expectReceiptError,
  setCharCode,
  validPackedCellsInput,
} from './packed-bijou-cells.test-support.js';

describe('RE-036 packed-bijou-cells/1 glyphs and colors', () => {
  it('rejects missing side-table references and invalid direct glyphs', () => {
    const missing = validPackedCellsInput();
    setCharCode(missing, 0, 0xf002);
    expectReceiptError(missing, 'invalid-glyph', '$.bytes[0]');

    const surrogate = validPackedCellsInput();
    setCharCode(surrogate, 0, 0xd800);
    expectReceiptError(surrogate, 'invalid-glyph', '$.bytes[0]');

    for (const code of [0x1b, 0x85, 0x0301, 0x200d, 0x202e, 0x754c]) {
      const input = validPackedCellsInput();
      setCharCode(input, 0, code);
      expectReceiptError(input, 'invalid-glyph', '$.bytes[0]');
    }
  });

  it('rejects malformed and non-canonical side-table entries', () => {
    const cases: readonly [unknown, string][] = [
      ['', '$.sideTable[0]'],
      ['\u001b[31m', '$.sideTable[0]'],
      ['\u009b', '$.sideTable[0]'],
      ['\u0301', '$.sideTable[0]'],
      ['\u200d', '$.sideTable[0]'],
      ['\u202e', '$.sideTable[0]'],
      ['A', '$.sideTable[0]'],
      ['ab', '$.sideTable[0]'],
      ['界', '$.sideTable[0]'],
    ];
    for (const [value, path] of cases) {
      const input = validPackedCellsInput();
      arrayField(input, 'sideTable')[0] = value;
      expectReceiptError(input, 'invalid-glyph', path);
    }

    const duplicate = validPackedCellsInput();
    arrayField(duplicate, 'sideTable')[1] = arrayField(
      duplicate,
      'sideTable',
    )[0];
    expectReceiptError(duplicate, 'invalid-glyph', '$.sideTable[1]');

    const unreferenced = validPackedCellsInput();
    setCharCode(unreferenced, 2, 65);
    expectReceiptError(unreferenced, 'invalid-glyph', '$.sideTable[1]');

    const oversized = validPackedCellsInput();
    arrayField(oversized, 'sideTable')[0] =
      `a${'\u0301'.repeat(MAX_PACKED_BIJOU_GLYPH_CODE_UNITS)}`;
    expectReceiptError(oversized, 'invalid-glyph', '$.sideTable[0]');
  });

  it('rejects absent colors with nonzero channels', () => {
    const foreground = validPackedCellsInput();
    arrayField(foreground, 'bytes')[12] = 1;
    expectReceiptError(foreground, 'invalid-color', '$.bytes[12]');

    const background = validPackedCellsInput();
    arrayField(background, 'bytes')[5] = 1;
    expectReceiptError(background, 'invalid-color', '$.bytes[5]');
  });

  it('rejects a dashed flag without dotted/dashed underline bits', () => {
    const input = validPackedCellsInput();
    arrayField(input, 'bytes')[8] = 0x40;
    expectReceiptError(input, 'invalid-modifier', '$.bytes[8]');
  });
});
