import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { DogfoodLocalePort } from './locale.js';

export interface NodeDogfoodLocaleEnv {
  readonly LANG?: string;
  readonly LANGUAGE?: string;
  readonly LC_ALL?: string;
  readonly LC_MESSAGES?: string;
  readonly HOME?: string;
  readonly XDG_STATE_HOME?: string;
}

export interface NodeDogfoodLocaleStorage {
  readText(path: string): string | undefined;
  writeText(path: string, text: string): void;
}

export interface NodeDogfoodLocaleOptions {
  readonly env?: NodeDogfoodLocaleEnv;
  readonly preferencePath?: string;
  readonly storage?: NodeDogfoodLocaleStorage;
}

function firstLocaleCandidate(value: string | undefined): string | undefined {
  const candidate = value?.split(':').find((entry) => entry.trim() !== '');
  return candidate?.trim();
}

function isNodeDogfoodLocaleOptions(
  input: NodeDogfoodLocaleEnv | NodeDogfoodLocaleOptions,
): input is NodeDogfoodLocaleOptions {
  return 'env' in input || 'preferencePath' in input || 'storage' in input;
}

const nodeDogfoodLocaleStorage: NodeDogfoodLocaleStorage = {
  readText(path) {
    try {
      return readFileSync(path, 'utf8');
    } catch {
      return undefined;
    }
  },
  writeText(path, text) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text, 'utf8');
  },
};

function defaultPreferencePath(env: NodeDogfoodLocaleEnv): string | undefined {
  const stateHome = env.XDG_STATE_HOME?.trim();
  if (stateHome != null && stateHome !== '') {
    return join(stateHome, 'bijou', 'dogfood-locale');
  }

  const home = env.HOME?.trim();
  if (home == null || home === '') return undefined;
  return join(home, '.local', 'state', 'bijou', 'dogfood-locale');
}

function readSavedLocale(
  storage: NodeDogfoodLocaleStorage,
  preferencePath: string | undefined,
): string | undefined {
  if (preferencePath == null) return undefined;
  try {
    return firstLocaleCandidate(storage.readText(preferencePath));
  } catch {
    return undefined;
  }
}

export function createNodeDogfoodLocalePort(
  input: NodeDogfoodLocaleEnv | NodeDogfoodLocaleOptions = process.env as NodeDogfoodLocaleEnv,
): DogfoodLocalePort {
  const options = isNodeDogfoodLocaleOptions(input) ? input : { env: input };
  const env = options.env ?? (process.env as NodeDogfoodLocaleEnv);
  const storage = options.storage ?? nodeDogfoodLocaleStorage;
  const preferencePath = options.preferencePath ?? defaultPreferencePath(env);

  return {
    preferredLocale() {
      return readSavedLocale(storage, preferencePath)
        ?? firstLocaleCandidate(env.LC_ALL)
        ?? firstLocaleCandidate(env.LC_MESSAGES)
        ?? firstLocaleCandidate(env.LANGUAGE)
        ?? firstLocaleCandidate(env.LANG)
        ?? Intl.DateTimeFormat().resolvedOptions().locale;
    },
    savePreferredLocale(locale) {
      if (preferencePath == null) return;
      try {
        storage.writeText(preferencePath, `${locale}\n`);
      } catch {
        // Preference persistence is best-effort; runtime locale activation wins.
      }
    },
  };
}
