import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MARKER } from './constants.mjs';
import { requireSealMarker } from './windows-seal.mjs';

describe('Windows image seal marker', () => {
  it('accepts the exact sealed text', () => {
    expect(() => { requireSealMarker(MARKER, 'Windows initialization'); }).not.toThrow();
  });

  it.each([
    ['a marker with a carriage return', 'bijou-test-seal-v1\r\n'],
    ['a marker with no line feed', 'bijou-test-seal-v1'],
    ['another version', 'bijou-test-seal-v2\n'],
    ['an empty marker', ''],
  ])('refuses %s and reports the text it read', (_name, text) => {
    // Oracle: hosted job 135343361112 refused its image and did not say what the marker contained.
    expect(() => { requireSealMarker(text, 'Windows initialization'); })
      .toThrow(`Windows initialization requires the sealed image: marker is ${JSON.stringify(text)}`);
  });

  it('reports at most 64 characters of a long marker', () => {
    expect(() => { requireSealMarker('x'.repeat(500), 'Windows initialization'); }).toThrow(`marker is ${JSON.stringify('x'.repeat(64))}`);
  });
});

describe('Seal marker file', () => {
  it('holds the exact sealed text in this checkout', () => {
    expect(readFileSync(new URL('./marker', import.meta.url), 'utf8')).toBe(MARKER);
  });

  it('keeps its exact bytes on a checkout that converts line endings', () => {
    // Oracle: gitattributes(5), "-text" turns off end-of-line conversion for the path.
    const attributes = readFileSync(new URL('../../.gitattributes', import.meta.url), 'utf8').split('\n');
    expect(attributes).toContain('scripts/docker-seal/marker -text');
  });
});
