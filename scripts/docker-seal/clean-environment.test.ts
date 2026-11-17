import { describe, expect, it } from 'vitest';
import { cleanEnvironment } from './constants.mjs';

describe('sealed host Git environment', () => {
  it('names the global configuration with the one null path Git accepts on every platform', () => {
    // Oracle: git-config(1) documents GIT_CONFIG_GLOBAL=/dev/null, and Git for Windows maps that spelling
    // itself. The Windows device path \\.\nul fails: "fatal: unable to access '\\.\nul': Invalid argument"
    // (hosted job 133829695648).
    expect(cleanEnvironment()['GIT_CONFIG_GLOBAL']).toBe('/dev/null');
  });

  it('disables the system configuration', () => {
    expect(cleanEnvironment()['GIT_CONFIG_NOSYSTEM']).toBe('1');
  });
});
