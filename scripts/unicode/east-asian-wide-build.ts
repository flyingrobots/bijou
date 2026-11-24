import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseEastAsianWide,
  renderEastAsianWideTable,
  sha256Hex,
  ucdFileVersion,
} from './east-asian-width.js';

/** The one Unicode version Bijou's width table is generated from. */
export const UCD_VERSION = '18.0.0';
/** Vendored Unicode Character Database files, repository-relative. */
export const UCD_DIRECTORY = `scripts/unicode/ucd/${UCD_VERSION}`;
export const EAST_ASIAN_WIDTH_INPUT = `${UCD_DIRECTORY}/EastAsianWidth.txt`;
export const UNICODE_LICENSE = 'scripts/unicode/ucd/UNICODE-LICENSE.txt';
export const WIDE_TABLE_GENERATOR = 'scripts/unicode/generate-east-asian-wide.ts';
/** The checked-in generated table, repository-relative. */
export const WIDE_TABLE_OUTPUT = 'packages/bijou/src/core/text/generated/east-asian-wide.ts';

/** Build the generated table source from the vendored inputs under `root`. */
export function buildEastAsianWideTable(root: string): string {
  const bytes = readFileSync(resolve(root, EAST_ASIAN_WIDTH_INPUT));
  const text = bytes.toString('utf8');
  const version = ucdFileVersion(text);
  if (version !== UCD_VERSION) {
    throw new Error(`${EAST_ASIAN_WIDTH_INPUT} is Unicode ${version}, expected ${UCD_VERSION}`);
  }
  return renderEastAsianWideTable({
    version,
    generator: WIDE_TABLE_GENERATOR,
    license: UNICODE_LICENSE,
    inputs: [{ path: EAST_ASIAN_WIDTH_INPUT, sha256: sha256Hex(bytes) }],
    ranges: parseEastAsianWide(text),
  });
}
