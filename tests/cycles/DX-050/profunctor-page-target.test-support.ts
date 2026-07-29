import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ArtifactInput {
  readonly filename: string;
  readonly source: string;
}

export interface ArtifactInputs {
  readonly page: ArtifactInput;
  readonly sourceMap: ArtifactInput;
  readonly buildManifest: ArtifactInput;
}

const FIXTURE = resolve(
  import.meta.dirname,
  '../../../fixtures/profunctor-page/project-keep/input',
);

function input(filename: string): ArtifactInput {
  return {
    filename,
    source: readFileSync(resolve(FIXTURE, filename), 'utf8'),
  };
}

export function fixtureInputs(): ArtifactInputs {
  return {
    page: input('page.profunctor.json'),
    sourceMap: input('page.profunctor.map.json'),
    buildManifest: input('page.profunctor.build.json'),
  };
}

export function sha256(source: string): string {
  return `sha256:${createHash('sha256').update(source).digest('hex')}`;
}

export function mutatePage(
  mutate: (page: Record<string, unknown>) => void,
): ArtifactInputs {
  const inputs = fixtureInputs();
  const page = parseRecord(inputs.page.source);
  mutate(page);
  const pageSource = `${JSON.stringify(page)}\n`;
  const manifest = parseRecord(inputs.buildManifest.source);
  manifest.artifactDigest = sha256(pageSource);
  return {
    ...inputs,
    page: { ...inputs.page, source: pageSource },
    buildManifest: {
      ...inputs.buildManifest,
      source: `${JSON.stringify(manifest)}\n`,
    },
  };
}

export function mutateSourceMap(
  mutate: (sourceMap: Record<string, unknown>) => void,
): ArtifactInputs {
  const inputs = fixtureInputs();
  const sourceMap = parseRecord(inputs.sourceMap.source);
  mutate(sourceMap);
  return {
    ...inputs,
    sourceMap: {
      ...inputs.sourceMap,
      source: `${JSON.stringify(sourceMap)}\n`,
    },
  };
}

export function records(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error('Expected record array');
  }
  return value;
}

export function generatedSource(filename: string): string {
  return readFileSync(resolve(FIXTURE, '../generated', filename), 'utf8');
}

export function recordAt(
  value: unknown,
  index: number,
): Record<string, unknown> {
  const record = records(value)[index];
  if (record == null) {
    throw new Error(`Missing record at ${String(index)}`);
  }
  return record;
}

function parseRecord(source: string): Record<string, unknown> {
  const value: unknown = JSON.parse(source);
  if (!isRecord(value)) {
    throw new Error('Expected JSON object');
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
