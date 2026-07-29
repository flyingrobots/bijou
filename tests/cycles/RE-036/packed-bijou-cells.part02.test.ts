import { describe, it } from 'vitest';
import {
  arrayField,
  expectReceiptError,
  recordField,
  validPackedCellsInput,
} from './packed-bijou-cells.test-support.js';

describe('RE-036 packed-bijou-cells/1 shape and dimensions', () => {
  it('rejects non-object inputs and unknown fields', () => {
    expectReceiptError(null, 'invalid-shape', '$');
    expectReceiptError([], 'invalid-shape', '$');

    const topLevel = validPackedCellsInput();
    topLevel.extra = true;
    expectReceiptError(topLevel, 'unknown-field', '$.extra');

    const nested = validPackedCellsInput();
    recordField(nested, 'focus').extra = true;
    expectReceiptError(nested, 'unknown-field', '$.focus.extra');

    const prototypeField = validPackedCellsInput();
    Object.defineProperty(prototypeField, '__proto__', {
      enumerable: true,
      value: {},
    });
    expectReceiptError(prototypeField, 'unknown-field', '$.__proto__');

    const escapedField = validPackedCellsInput();
    escapedField['line\nbreak'] = true;
    expectReceiptError(
      escapedField,
      'unknown-field',
      '$["line\\nbreak"]',
    );

    const controlField = validPackedCellsInput();
    controlField['\u009b'] = true;
    expectReceiptError(controlField, 'unknown-field', '$["\\u009b"]');

    const bidiField = validPackedCellsInput();
    bidiField['\u202e'] = true;
    expectReceiptError(bidiField, 'unknown-field', '$["\\u202e"]');
  });

  it('rejects non-JSON objects, accessors, symbols, and sparse arrays', () => {
    const nonPlain = validPackedCellsInput();
    Object.setPrototypeOf(nonPlain, { inherited: true });
    expectReceiptError(nonPlain, 'invalid-shape', '$');

    const accessor = validPackedCellsInput();
    Object.defineProperty(accessor, 'receiptVersion', {
      enumerable: true,
      get: () => 'packed-bijou-cells/1',
    });
    expectReceiptError(accessor, 'invalid-shape', '$.receiptVersion');

    const nonEnumerable = validPackedCellsInput();
    Object.defineProperty(nonEnumerable, 'receiptVersion', {
      enumerable: false,
      value: 'packed-bijou-cells/1',
    });
    expectReceiptError(nonEnumerable, 'invalid-shape', '$.receiptVersion');

    const symbol = validPackedCellsInput();
    Object.defineProperty(symbol, Symbol('extra'), { value: true });
    expectReceiptError(symbol, 'invalid-shape', '$');

    const sparse = validPackedCellsInput();
    const bytes = arrayField(sparse, 'bytes');
    const sparseBytes = new Array<unknown>(bytes.length);
    for (let index = 1; index < bytes.length; index += 1) {
      sparseBytes[index] = bytes[index];
    }
    sparse.bytes = sparseBytes;
    expectReceiptError(sparse, 'invalid-shape', '$.bytes[0]');

    const nonEnumerableArrayEntry = validPackedCellsInput();
    const nonEnumerableBytes = arrayField(nonEnumerableArrayEntry, 'bytes');
    Object.defineProperty(nonEnumerableBytes, '0', {
      enumerable: false,
      value: nonEnumerableBytes[0],
    });
    expectReceiptError(
      nonEnumerableArrayEntry,
      'invalid-shape',
      '$.bytes[0]',
    );

    const nonPlainArray = validPackedCellsInput();
    Object.setPrototypeOf(arrayField(nonPlainArray, 'bytes'), {});
    expectReceiptError(nonPlainArray, 'invalid-shape', '$.bytes');

    const arrayExtra = validPackedCellsInput();
    Object.defineProperty(arrayField(arrayExtra, 'bytes'), 'extra', {
      value: true,
    });
    expectReceiptError(arrayExtra, 'unknown-field', '$.bytes.extra');
  });

  it('rejects wrong version and policy literals', () => {
    const version = validPackedCellsInput();
    version.receiptVersion = 'packed-bijou-cells/2';
    expectReceiptError(version, 'wrong-literal', '$.receiptVersion');

    const format = validPackedCellsInput();
    format.cellFormatId = 'other';
    expectReceiptError(format, 'wrong-literal', '$.cellFormatId');

    const glyphs = validPackedCellsInput();
    glyphs.glyphPolicyId = 'other';
    expectReceiptError(glyphs, 'wrong-literal', '$.glyphPolicyId');
  });

  it('rejects byte-length mismatches and invalid byte values', () => {
    const short = validPackedCellsInput();
    arrayField(short, 'bytes').pop();
    expectReceiptError(short, 'byte-length-mismatch', '$.bytes');

    const long = validPackedCellsInput();
    arrayField(long, 'bytes').push(0);
    expectReceiptError(long, 'byte-length-mismatch', '$.bytes');

    for (const value of [-1, -0, 1.5, 256, '0']) {
      const input = validPackedCellsInput();
      arrayField(input, 'bytes')[4] = value;
      expectReceiptError(input, 'invalid-byte', '$.bytes[4]');
    }
  });
});
