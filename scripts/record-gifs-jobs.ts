import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export type RecordJobKind = 'native' | 'vhs';

export interface RecordJob {
  readonly example: string;
  readonly kind: RecordJobKind;
  readonly path: string;
}

export function discoverRecordJobs(
  root: string,
  requestedExamples: readonly string[],
  warn: (message: string) => void,
): RecordJob[] {
  const explicit = requestedExamples.length > 0;
  const examples = explicit
    ? requestedExamples
    : readdirSync(resolve(root, 'examples'));
  const jobs: RecordJob[] = [];
  for (const name of examples) {
    const job = buildRecordJob(root, name);
    if (job !== null) {
      jobs.push(job);
    } else if (explicit) {
      warn(`${name}: no record.ts or demo.tape found, skipping`);
    }
  }
  return explicit
    ? jobs
    : jobs.sort((left, right) => left.example.localeCompare(right.example));
}

function buildRecordJob(root: string, name: string): RecordJob | null {
  const nativePath = resolve(root, 'examples', name, 'record.ts');
  if (existsSync(nativePath)) {
    return { example: name, kind: 'native', path: nativePath };
  }
  const tapePath = resolve(root, 'examples', name, 'demo.tape');
  return existsSync(tapePath)
    ? { example: name, kind: 'vhs', path: tapePath }
    : null;
}

type NativeRecorder = () => void | Promise<void>;

function isNativeRecorder(value: unknown): value is NativeRecorder {
  return typeof value === 'function';
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export async function recordNative(entryPath: string): Promise<void> {
  const module: unknown = await import(pathToFileURL(entryPath).href);
  const recorder = isObjectRecord(module) ? module['default'] : undefined;
  if (!isNativeRecorder(recorder)) {
    throw new Error(`${entryPath} does not export a default recorder function`);
  }
  await recorder();
}
