import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lowerProfunctorPageArtifacts } from '../packages/bijou/src/core/profunctor-page-target.js';

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
  const backup = `${OUTPUT}.previous`;
  for (const [filename, source] of expected) {
    writeFileSync(resolve(stage, filename), source, 'utf8');
  }
  rmSync(backup, { force: true, recursive: true });
  let movedExisting = false;
  try {
    if (existsSync(OUTPUT)) {
      renameSync(OUTPUT, backup);
      movedExisting = true;
    }
    renameSync(stage, OUTPUT);
    rmSync(backup, { force: true, recursive: true });
  } catch (error) {
    rmSync(OUTPUT, { force: true, recursive: true });
    if (movedExisting && existsSync(backup)) {
      renameSync(backup, OUTPUT);
    }
    rmSync(stage, { force: true, recursive: true });
    throw error;
  }
  mkdirSync(OUTPUT, { recursive: true });
}
