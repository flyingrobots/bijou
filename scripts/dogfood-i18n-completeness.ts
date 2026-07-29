#!/usr/bin/env tsx

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { runDogfoodI18nCompleteness } from './dogfood-i18n-completeness.part02.js';
export type {
  DogfoodI18nCompletenessIssue,
  DogfoodI18nCompletenessResult,
  DogfoodI18nMissingTranslationBaseline,
  DogfoodI18nMissingTranslationLocaleCount,
  DogfoodI18nMissingTranslationRatchetResult,
  DogfoodI18nCompletenessOptions,
  DogfoodI18nCompletenessIO,
} from './dogfood-i18n-completeness.part01.js';
export {
  DOGFOOD_I18N_MISSING_TRANSLATION_BASELINE,
  evaluateDogfoodI18nCompleteness,
} from './dogfood-i18n-completeness.part01.js';
export {
  evaluateDogfoodI18nMissingTranslationRatchet,
  runDogfoodI18nCompleteness,
} from './dogfood-i18n-completeness.part02.js';

if (
  process.argv[1] != null &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  process.exitCode = runDogfoodI18nCompleteness();
}
