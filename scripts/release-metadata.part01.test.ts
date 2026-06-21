import { rmSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';
import { parseReleaseTag, validateReleaseVersion } from './release-metadata.js';

const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root != null) rmSync(root, { recursive: true, force: true });
  }
});

describe('parseReleaseTag', () => {
  it('parses stable tags', () => {
    expect(parseReleaseTag('v3.0.0')).toEqual({
      tag: 'v3.0.0',
      tagVersion: '3.0.0',
      isPrerelease: false,
      npmDistTag: 'latest',
    });
  });
  it('parses prerelease tags', () => {
    expect(parseReleaseTag('v3.1.0-rc.2')).toEqual({
      tag: 'v3.1.0-rc.2',
      tagVersion: '3.1.0-rc.2',
      isPrerelease: true,
      npmDistTag: 'next',
    });
  });
  it('rejects invalid tags', () => {
    expect(() => parseReleaseTag('release-3.0.0')).toThrow('Invalid tag format');
  });
  it('rejects tags with leading-zero numeric identifiers', () => {
    expect(() => parseReleaseTag('v01.2.3')).toThrow('Invalid tag format');
    expect(() => parseReleaseTag('v3.1.0-rc.01')).toThrow('Invalid tag format');
  });
});

describe('validateReleaseVersion', () => {
  it('accepts valid release versions', () => {
    expect(validateReleaseVersion('3.0.0')).toBe('3.0.0');
    expect(validateReleaseVersion('3.1.0-beta.2')).toBe('3.1.0-beta.2');
  });
  it('rejects leading-zero numeric identifiers', () => {
    expect(() => validateReleaseVersion('01.2.3')).toThrow('Invalid release version');
    expect(() => validateReleaseVersion('3.1.0-rc.01')).toThrow('Invalid release version');
  });
});
