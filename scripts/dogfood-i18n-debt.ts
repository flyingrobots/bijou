#!/usr/bin/env tsx

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import {
  DOGFOOD_I18N_DEBT_BASELINE,
  DOGFOOD_MARKDOWN_LOCALIZATION_BASELINE,
  collectDogfoodI18nDebt,
  collectDogfoodMarkdownLocalizationDebt,
  evaluateDogfoodI18nDebtRatchet,
  evaluateDogfoodMarkdownLocalizationRatchet,
  evaluateDogfoodTouchedI18nDebt,
  type DogfoodI18nDebtBaseline,
  type DogfoodI18nDebtInventory,
  type DogfoodMarkdownLocalizationBaseline,
  type DogfoodMarkdownLocalizationInventory,
} from '../examples/docs/i18n-debt.js';

export interface DogfoodI18nDebtInventoryIO {
  readonly args?: readonly string[];
  readonly changedPaths?: readonly string[];
  readonly inventory?: DogfoodI18nDebtInventory;
  readonly baseline?: DogfoodI18nDebtBaseline;
  readonly markdownInventory?: DogfoodMarkdownLocalizationInventory;
  readonly markdownBaseline?: DogfoodMarkdownLocalizationBaseline;
  readonly gitOutput?: (args: readonly string[]) => string;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}

const DEFAULT_BASE_REF = 'origin/main';

export function runDogfoodI18nDebtInventory(io: DogfoodI18nDebtInventoryIO = {}): number {
  const args = io.args ?? process.argv.slice(2);
  const stdout = io.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text: string) => process.stderr.write(text));
  if (args.includes('--help')) {
    stdout([
      'Usage: npm run dogfood:i18n:debt [-- --base <ref>]',
      '',
      'Enforces the DOGFOOD raw-string debt baseline, Markdown localization baseline,',
      'and the touched-file raw-string cleanup rule.',
      '',
    ].join('\n'));
    return 0;
  }

  const inventory = io.inventory ?? collectDogfoodI18nDebt();
  const baseline = io.baseline ?? DOGFOOD_I18N_DEBT_BASELINE;
  const markdownInventory = io.markdownInventory ?? collectDogfoodMarkdownLocalizationDebt();
  const markdownBaseline = io.markdownBaseline ?? DOGFOOD_MARKDOWN_LOCALIZATION_BASELINE;
  const result = evaluateDogfoodI18nDebtRatchet(inventory, baseline);
  const markdownResult = evaluateDogfoodMarkdownLocalizationRatchet(markdownInventory, markdownBaseline);
  const changedPaths = io.changedPaths ?? changedPathsFromBase(baseRefFromArgs(args), io.gitOutput ?? gitOutput);
  const touchedResult = evaluateDogfoodTouchedI18nDebt(inventory, changedPaths);

  if (!result.ok || !markdownResult.ok || !touchedResult.ok) {
    stderr([
      `dogfood-i18n-debt: failed (${inventory.total} raw strings; baseline ${baseline.total}; ${markdownInventory.total} missing Markdown localizations; baseline ${markdownBaseline.total})`,
      ...result.violations.map((violation) => `- ${violation}`),
      ...markdownResult.violations.map((violation) => `- ${violation}`),
      ...touchedResult.violations.map((violation) => `- ${violation}`),
      '',
    ].join('\n'));
    return 1;
  }

  stdout([
    `dogfood-i18n-debt: ok (${inventory.total} raw strings; baseline ${baseline.total}; ${markdownInventory.total} missing Markdown localizations; baseline ${markdownBaseline.total})`,
    ...inventory.bySurface.map((surface) => `- ${surface.surface}: ${surface.count}`),
    ...markdownInventory.byLocale.map((locale) => `- markdown ${locale.locale}: ${locale.count}`),
    '',
  ].join('\n'));
  return 0;
}

function baseRefFromArgs(args: readonly string[]): string {
  const explicitBaseIndex = args.indexOf('--base');
  if (explicitBaseIndex >= 0 && args[explicitBaseIndex + 1] === undefined) {
    throw new Error('missing value for --base');
  }
  const explicitBase = explicitBaseIndex >= 0 ? args[explicitBaseIndex + 1] : undefined;
  return explicitBase ?? process.env.DOGFOOD_I18N_BASE_REF ?? DEFAULT_BASE_REF;
}

function changedPathsFromBase(baseRef: string, runGit: (args: readonly string[]) => string): readonly string[] {
  const paths = new Set<string>();
  const mergeBase = mergeBaseFor(baseRef, runGit);
  if (mergeBase !== undefined) {
    for (const path of gitLines(['diff', '--name-only', `${mergeBase}...HEAD`], runGit)) {
      paths.add(path);
    }
  }
  for (const path of gitLines(['diff', '--name-only', '--cached'], runGit)) {
    paths.add(path);
  }
  for (const path of gitLines(['diff', '--name-only'], runGit)) {
    paths.add(path);
  }
  return Object.freeze([...paths].sort());
}

function mergeBaseFor(baseRef: string, runGit: (args: readonly string[]) => string): string | undefined {
  try {
    return runGit(['merge-base', 'HEAD', baseRef]).trim() || baseRef;
  } catch {
    return undefined;
  }
}

function gitLines(args: readonly string[], runGit: (args: readonly string[]) => string): readonly string[] {
  return runGit(args)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function gitOutput(args: readonly string[]): string {
  return execFileSync('git', [...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function main(): void {
  try {
    process.exitCode = runDogfoodI18nDebtInventory();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`dogfood-i18n-debt: ${message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
