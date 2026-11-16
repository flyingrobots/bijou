import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  collectDogfoodI18nDebt,
  collectDogfoodMarkdownLocalizationDebt,
  discoverDogfoodI18nDebtSources,
} from '../examples/docs/i18n-debt.js';
import { runDogfoodI18nDebtInventory } from './dogfood-i18n-debt.js';

/** Real Git and source-file boundary for the public debt command. */
export function runDebtGitFixture(
  base: Readonly<Record<string, readonly string[]>>,
  current: Readonly<Record<string, readonly string[]>>,
): { readonly exitCode: number; readonly stderr: string } {
  const root = mkdtempSync(join(tmpdir(), 'bijou-debt-groups-'));
  const git = (args: readonly string[]): string => execFileSync('git', [...args], {
    cwd: root, encoding: 'utf8', timeout: 5_000, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const writeSources = (files: Readonly<Record<string, readonly string[]>>): void => {
    for (const [path, values] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), `export const labels = ${JSON.stringify(values)};\n`);
    }
  };
  const inventoryFor = (paths: readonly string[]) => collectDogfoodI18nDebt({
    sources: discoverDogfoodI18nDebtSources({ paths }).map((source) => ({
      ...source, text: readFileSync(join(root, source.path), 'utf8'),
    })),
  });
  try {
    git(['init', '-q']);
    git(['config', 'user.name', 'Debt fixture']);
    git(['config', 'user.email', 'debt@example.invalid']);
    git(['config', 'commit.gpgsign', 'false']);
    writeSources(base);
    const baseInventory = inventoryFor(Object.keys(base));
    git(['add', '.']);
    git(['commit', '-qm', 'fixture base']);
    for (const path of Object.keys(base)) rmSync(join(root, path));
    writeSources(current);
    git(['add', '-A']);
    const inventory = inventoryFor(Object.keys(current));
    const bySurface: Record<string, number> = {};
    for (const surface of [...baseInventory.bySurface, ...inventory.bySurface]) {
      bySurface[surface.surface] = Math.max(bySurface[surface.surface] ?? 0, surface.count);
    }
    const stderr: string[] = [];
    const exitCode = runDogfoodI18nDebtInventory({
      args: ['--base', 'HEAD'], inventory,
      baseline: { total: baseInventory.total, bySurface },
      markdownInventory: collectDogfoodMarkdownLocalizationDebt({ sources: [] }),
      markdownBaseline: { total: 0, byLocale: {} },
      gitOutput: git, stdout: () => undefined, stderr: (text) => stderr.push(text),
    });
    return { exitCode, stderr: stderr.join('') };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
