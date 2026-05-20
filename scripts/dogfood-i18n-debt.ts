#!/usr/bin/env tsx

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import {
  DOGFOOD_I18N_DEBT_BASELINE,
  collectDogfoodI18nDebt,
  evaluateDogfoodI18nDebtRatchet,
  type DogfoodI18nDebtBaseline,
  type DogfoodI18nDebtInventory,
} from '../examples/docs/i18n-debt.js';

export interface DogfoodI18nDebtInventoryIO {
  readonly inventory?: DogfoodI18nDebtInventory;
  readonly baseline?: DogfoodI18nDebtBaseline;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}

export function runDogfoodI18nDebtInventory(io: DogfoodI18nDebtInventoryIO = {}): number {
  const stdout = io.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text: string) => process.stderr.write(text));
  const inventory = io.inventory ?? collectDogfoodI18nDebt();
  const baseline = io.baseline ?? DOGFOOD_I18N_DEBT_BASELINE;
  const result = evaluateDogfoodI18nDebtRatchet(inventory, baseline);

  if (!result.ok) {
    stderr([
      `dogfood-i18n-debt: failed (${inventory.total} raw strings; baseline ${baseline.total})`,
      ...result.violations.map((violation) => `- ${violation}`),
      '',
    ].join('\n'));
    return 1;
  }

  stdout([
    `dogfood-i18n-debt: ok (${inventory.total} raw strings; baseline ${baseline.total})`,
    ...inventory.bySurface.map((surface) => `- ${surface.surface}: ${surface.count}`),
    '',
  ].join('\n'));
  return 0;
}

function main(): void {
  process.exitCode = runDogfoodI18nDebtInventory();
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
