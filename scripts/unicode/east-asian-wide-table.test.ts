import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  EAST_ASIAN_WIDE_RANGES,
  EAST_ASIAN_WIDE_UNICODE_VERSION,
} from '../../packages/bijou/src/core/text/generated/east-asian-wide.js';
import {
  EAST_ASIAN_WIDTH_INPUT,
  UCD_VERSION,
  UNICODE_LICENSE,
  WIDE_TABLE_OUTPUT,
  buildEastAsianWideTable,
} from './east-asian-wide-build.js';
import { parseEastAsianHalfwidth, parseEastAsianWide, sha256Hex } from './east-asian-width.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path: string): string => readFileSync(resolve(ROOT, path), 'utf8');

describe('generated East Asian wide table (flyingrobots/bijou#860)', () => {
  it('is exactly what the generator produces from the vendored UCD files', () => {
    expect(read(WIDE_TABLE_OUTPUT)).toBe(buildEastAsianWideTable(ROOT));
  });

  it('names its Unicode version, its input digest and that it is generated', () => {
    const table = read(WIDE_TABLE_OUTPUT);
    const digest = sha256Hex(readFileSync(resolve(ROOT, EAST_ASIAN_WIDTH_INPUT)));
    expect(EAST_ASIAN_WIDE_UNICODE_VERSION).toBe(UCD_VERSION);
    expect(table.startsWith('// generated, do not edit.\n')).toBe(true);
    expect(table).toContain(`// Input: ${EAST_ASIAN_WIDTH_INPUT} sha256 ${digest}`);
    expect(read(EAST_ASIAN_WIDTH_INPUT).startsWith(`# EastAsianWidth-${UCD_VERSION}.txt`)).toBe(true);
    expect(read(UNICODE_LICENSE)).toContain('UNICODE LICENSE V3');
  });

  it('holds sorted, disjoint, non-adjacent ranges', () => {
    let previous = -2;
    for (const [first, last] of EAST_ASIAN_WIDE_RANGES) {
      expect(first).toBeGreaterThan(previous + 1);
      expect(last).toBeGreaterThanOrEqual(first);
      previous = last;
    }
  });
});

describe('parseEastAsianWide', () => {
  it('keeps W and F, drops A, H, N and Na, and merges adjacent ranges', () => {
    const text = [
      '# EastAsianWidth-0.0.0.txt',
      '0041..005A ; Na # Lu',
      '1100..115F ; W  # Lo',
      '1160       ; N  # Lo',
      '3000       ; F  # Zs',
      '3001..3003 ; W  # Po',
      '3248..324F ; A  # No',
      'FF61       ; H  # Po',
    ].join('\n');
    expect(parseEastAsianWide(text)).toEqual([[0x1100, 0x115f], [0x3000, 0x3003]]);
  });

  it('keeps only H for the halfwidth ranges, merging adjacent ones', () => {
    const text = [
      '# EastAsianWidth-0.0.0.txt',
      '20A9       ; H  # Sc',
      'FF61       ; H  # Po',
      'FF62..FF9F ; H  # Lo',
      'FFA0       ; W  # Lo',
      'FFE8       ; H  # So',
    ].join('\n');
    expect(parseEastAsianHalfwidth(text)).toEqual([[0x20a9, 0x20a9], [0xff61, 0xff9f], [0xffe8, 0xffe8]]);
  });

  it('applies @missing defaults before data lines override them', () => {
    const text = [
      '# @missing: 0000..10FFFF; N',
      '# @missing: 3400..4DBF; W',
      '3500 ; N # Cn',
    ].join('\n');
    expect(parseEastAsianWide(text)).toEqual([[0x3400, 0x34ff], [0x3501, 0x4dbf]]);
  });
});
