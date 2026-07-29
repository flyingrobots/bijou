import {
  arrayAt,
  failPackedCells,
  type JsonRecord,
} from './packed-bijou-cells-schema.js';

export function validatePackedBytes(
  record: JsonRecord,
  expectedLength: number,
): number[] {
  if (
    Array.isArray(record['bytes']) &&
    record['bytes'].length !== expectedLength
  ) {
    failPackedCells(
      'byte-length-mismatch',
      '$.bytes',
      `expected ${String(expectedLength)} bytes, received ${String(record['bytes'].length)}`,
    );
  }
  const raw = arrayAt(record['bytes'], '$.bytes', expectedLength);
  if (raw.length !== expectedLength) {
    failPackedCells(
      'byte-length-mismatch',
      '$.bytes',
      `expected ${String(expectedLength)} bytes, received ${String(raw.length)}`,
    );
  }
  return raw.map((value, index) => {
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > 255
    ) {
      failPackedCells(
        'invalid-byte',
        `$.bytes[${String(index)}]`,
        'expected 0..255',
      );
    }
    return value;
  });
}
