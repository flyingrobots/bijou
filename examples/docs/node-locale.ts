import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  resolveDogfoodLocale,
  type DogfoodLocalePort,
  type DogfoodLocalePreferencePort,
} from './locale.js';

export interface NodeDogfoodLocaleEnv {
  readonly LANG?: string;
  readonly LANGUAGE?: string;
  readonly LC_ALL?: string;
  readonly LC_MESSAGES?: string;
  readonly BIJOU_DOGFOOD_LOCALE_PREFERENCE_PATH?: string;
  readonly HOME?: string;
  readonly XDG_STATE_HOME?: string;
}

export interface NodeDogfoodLocalePreferenceFs {
  existsSync(path: string): boolean;
  readFileSync(path: string): string;
  mkdirSync(path: string): void;
  writeFileSync(path: string, content: string): void;
}

export interface NodeDogfoodLocalePreferenceOptions {
  readonly env?: NodeDogfoodLocaleEnv;
  readonly filePath?: string;
  readonly fs?: NodeDogfoodLocalePreferenceFs;
}

function firstLocaleCandidate(value: string | undefined): string | undefined {
  const candidate = value?.split(':').find((entry) => entry.trim() !== '');
  return candidate?.trim();
}

export function createNodeDogfoodLocalePort(
  env: NodeDogfoodLocaleEnv = process.env as NodeDogfoodLocaleEnv,
): DogfoodLocalePort {
  return {
    preferredLocale() {
      return firstLocaleCandidate(env.LC_ALL)
        ?? firstLocaleCandidate(env.LC_MESSAGES)
        ?? firstLocaleCandidate(env.LANGUAGE)
        ?? firstLocaleCandidate(env.LANG)
        ?? Intl.DateTimeFormat().resolvedOptions().locale;
    },
  };
}

const NODE_LOCALE_PREFERENCE_FS: NodeDogfoodLocalePreferenceFs = Object.freeze({
  existsSync,
  readFileSync: (path: string) => readFileSync(path, 'utf8'),
  mkdirSync: (path: string) => {
    mkdirSync(path, { recursive: true });
  },
  writeFileSync: (path: string, content: string) => {
    writeFileSync(path, content, 'utf8');
  },
});

export function createNodeDogfoodLocalePreferencePort(
  options: NodeDogfoodLocalePreferenceOptions = {},
): DogfoodLocalePreferencePort {
  const env = options.env ?? (process.env as NodeDogfoodLocaleEnv);
  const filePath = options.filePath ?? defaultLocalePreferencePath(env);
  const fs = options.fs ?? NODE_LOCALE_PREFERENCE_FS;

  return {
    readPreferredLocale() {
      if (filePath == null || !fs.existsSync(filePath)) return undefined;
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath)) as unknown;
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined;
        const locale = (parsed as { locale?: unknown }).locale;
        return typeof locale === 'string' ? resolveDogfoodLocale(locale).id : undefined;
      } catch {
        return undefined;
      }
    },
    writePreferredLocale(locale) {
      if (filePath == null) return;
      fs.mkdirSync(dirname(filePath));
      fs.writeFileSync(filePath, `${JSON.stringify({ locale: resolveDogfoodLocale(locale).id }, null, 2)}\n`);
    },
  };
}

function defaultLocalePreferencePath(env: NodeDogfoodLocaleEnv): string | undefined {
  const explicitPath = nonEmptyEnvValue(env.BIJOU_DOGFOOD_LOCALE_PREFERENCE_PATH);
  if (explicitPath !== undefined) {
    return explicitPath;
  }
  const xdgStateHome = nonEmptyEnvValue(env.XDG_STATE_HOME);
  if (xdgStateHome !== undefined) {
    return join(xdgStateHome, 'bijou', 'dogfood-locale.json');
  }
  const home = nonEmptyEnvValue(env.HOME);
  if (home !== undefined) {
    return join(home, '.local', 'state', 'bijou', 'dogfood-locale.json');
  }
  return undefined;
}

function nonEmptyEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === '' ? undefined : trimmed;
}
