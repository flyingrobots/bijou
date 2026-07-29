import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lowerProfunctorPageArtifacts } from '../packages/bijou/src/core/profunctor-page-target.js';
import { replaceGeneratedDirectory } from './replace-generated-directory.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = resolve(ROOT, 'fixtures/profunctor-page/project-keep');
const INPUT = resolve(FIXTURE, 'input');
const OUTPUT = resolve(FIXTURE, 'generated');
const CHECK = process.argv.includes('--check');

const proof = lowerProfunctorPageArtifacts({
  page: artifactInput('page.profunctor.json'),
  sourceMap: artifactInput('page.profunctor.map.json'),
  buildManifest: artifactInput('page.profunctor.build.json'),
});
const expected = new Map(Object.values(proof.artifacts).map((artifact) => [
  artifact.filename,
  artifact.source,
]));

if (CHECK) {
  checkGenerated();
  process.stdout.write(`Verified ${String(expected.size)} Profunctor Page target artifacts.\n`);
} else {
  replaceGenerated();
  process.stdout.write(`Wrote ${String(expected.size)} Profunctor Page target artifacts.\n`);
}

function artifactInput(filename: string): { filename: string; source: string } {
  return {
    filename,
    source: readFileSync(resolve(INPUT, filename), 'utf8'),
  };
}

function checkGenerated(): void {
  const actualNames = existsSync(OUTPUT) ? readdirSync(OUTPUT).sort() : [];
  const expectedNames = [...expected.keys()].sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Error(`Generated inventory drift: ${actualNames.join(', ') || 'missing'}`);
  }
  for (const [filename, source] of expected) {
    if (readFileSync(resolve(OUTPUT, filename), 'utf8') !== source) {
      throw new Error(`Generated artifact drift: ${filename}`);
    }
  }
}

function replaceGenerated(): void {
  const stage = mkdtempSync(resolve(FIXTURE, '.generated-stage-'));
  for (const [filename, source] of expected) {
    writeFileSync(resolve(stage, filename), source, 'utf8');
  }
  replaceGeneratedDirectory(stage, OUTPUT, `${OUTPUT}.previous`);
}
