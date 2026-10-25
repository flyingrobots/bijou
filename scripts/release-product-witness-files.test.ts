import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RELEASE_WITNESS_FILES, verifyReleaseWitnessFiles } from './release-product-witness-files.js';

function withFixtureCopy(run: (root: string) => void): void {
  const root = mkdtempSync(resolve(tmpdir(), 'bijou-witness-files-'));
  try {
    for (const file of RELEASE_WITNESS_FILES) {
      const target = resolve(root, file.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(resolve(process.cwd(), file.path)));
    }
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('release witness file identity', () => {
  it('accepts the exact canonical fixture and generated artifact bytes', () => {
    withFixtureCopy((root) => {
      expect(verifyReleaseWitnessFiles(root)).toHaveLength(9);
    });
  });

  it.each([
    'examples/docs/fixtures/graphql/navigation-list.graphql',
    'tests/fixtures/RE-036/packed-bijou-cells.v1.json',
    'fixtures/profunctor-page/project-keep/generated/page.bijou.scene.json',
  ])('rejects actual byte changes to %s', (path) => {
    withFixtureCopy((root) => {
      const target = resolve(root, path);
      writeFileSync(target, `${readFileSync(target, 'utf8')}\n`);
      expect(() => verifyReleaseWitnessFiles(root)).toThrow(`Witness drift: ${path}`);
    });
  });

  it('rejects a missing canonical input', () => {
    withFixtureCopy((root) => {
      rmSync(resolve(root, 'fixtures/profunctor-page/project-keep/input/page.profunctor.json'));
      expect(() => verifyReleaseWitnessFiles(root)).toThrow();
    });
  });
});
