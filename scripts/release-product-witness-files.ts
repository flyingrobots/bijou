import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ReleaseWitnessFile {
  readonly path: string;
  readonly sha256: string;
}

export interface ReleaseProductWitnessReceipt {
  readonly schema: 'bijou-product-witness-replay/1';
  readonly scope: 'product-witnesses-only';
  readonly sourceCommit: string;
  readonly packageVersion: string;
  readonly nodeVersion: string;
  readonly lockSha256: string;
  readonly files: readonly ReleaseWitnessFile[];
  readonly checks: readonly {
    readonly label: string;
    readonly command: readonly string[];
    readonly status: 'pass';
  }[];
}

export const RELEASE_WITNESS_FILES: readonly ReleaseWitnessFile[] = [
  {
    path: 'examples/docs/fixtures/graphql/navigation-list.graphql',
    sha256: '7075ba7a417e810464333009afddd8213d12e3ff5a75879c222b3f860de58795',
  },
  {
    path: 'fixtures/profunctor-page/project-keep/generated/page.bijou.map.json',
    sha256: '191b5ff59880f776e58bd37babbebb8331c0bfec3d56c3b86c251d36fc732143',
  },
  {
    path: 'fixtures/profunctor-page/project-keep/generated/page.bijou.receipt.json',
    sha256: '688c741b6121846a116ffc2500ae9b6bc6561456959723b0623f5ed6eb710c19',
  },
  {
    path: 'fixtures/profunctor-page/project-keep/generated/page.bijou.scene.json',
    sha256: 'c3d025783ec7cd133062ec947e35f02ad1a4698d2db4b7df5d408203e638f580',
  },
  {
    path: 'fixtures/profunctor-page/project-keep/generated/page.bijou.txt',
    sha256: '04da1974e3fd3203e48d5de8831c360a1ad3fe76937988b273b8048bb452bc9d',
  },
  {
    path: 'fixtures/profunctor-page/project-keep/input/page.profunctor.build.json',
    sha256: '975efc9c701cbd7a6981787150748b76d1e53fd83cd424128667bc8014687ab7',
  },
  {
    path: 'fixtures/profunctor-page/project-keep/input/page.profunctor.json',
    sha256: '12b90184b4e238bc6bd7db944af8651900b830ea76ba775ab7c7ee20be051e73',
  },
  {
    path: 'fixtures/profunctor-page/project-keep/input/page.profunctor.map.json',
    sha256: 'a40e97f2fd513519092d2a131c0d7107517b92bd7e9cfd5e79df70a65a3fe044',
  },
  {
    path: 'tests/fixtures/RE-036/packed-bijou-cells.v1.json',
    sha256: '44bdac709151e09a080e5f6966b82f3ce7734f65e35b9ea616fdec989a5a1ded',
  },
];

export function witnessFileHash(root: string, path: string): string {
  return createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
}

export function verifyReleaseWitnessFiles(root: string): readonly ReleaseWitnessFile[] {
  return RELEASE_WITNESS_FILES.map((file) => {
    const actual = witnessFileHash(root, file.path);
    if (actual !== file.sha256) {
      throw new Error(`Witness drift: ${file.path}; expected ${file.sha256}, found ${actual}`);
    }
    return { path: file.path, sha256: actual };
  });
}
