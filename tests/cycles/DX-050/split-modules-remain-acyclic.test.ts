import { readdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findRuntimeCyclesTouching,
  listProjectTypeScriptFiles,
} from './runtime-import-cycles.js';
import { TRANCHE_A_CLEARED_PATHS } from './tranche-a-paths.js';

const ROOT = resolve(import.meta.dirname, '../../..');

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitModules(entrypoint: string): readonly string[] {
  const directory = dirname(entrypoint);
  const stem = basename(entrypoint).replace(/\.tsx?$/u, '');
  const pattern = new RegExp(
    `^${escapeRegExp(stem)}(?:\\.part\\d+|-[^.]+)?\\.tsx?$`,
    'u',
  );
  return readdirSync(directory)
    .filter((name) => pattern.test(name))
    .map((name) => resolve(directory, name));
}

describe('DX-050 tranche A split-module architecture', () => {
  it('keeps every extracted family out of repository runtime cycles', () => {
    const projectFiles = listProjectTypeScriptFiles(ROOT);
    const trancheFiles = TRANCHE_A_CLEARED_PATHS.flatMap((entrypoint) => {
      const files = splitModules(resolve(ROOT, entrypoint));
      expect(files.length, entrypoint).toBeGreaterThan(1);
      return files;
    });

    expect(
      findRuntimeCyclesTouching(projectFiles, trancheFiles),
    ).toEqual([]);
  });
});
