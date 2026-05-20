import type { DogfoodLocalePort } from './locale.js';

export interface NodeDogfoodLocaleEnv {
  readonly LANG?: string;
  readonly LANGUAGE?: string;
  readonly LC_ALL?: string;
  readonly LC_MESSAGES?: string;
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
