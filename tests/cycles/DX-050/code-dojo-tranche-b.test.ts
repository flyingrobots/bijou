import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { stripAnsi, surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createI18nRuntime, createRuntimeLocalizationPort } from '@flyingrobots/bijou-i18n';
import { describe, expect, it } from 'vitest';
import { counterDemoBlockConfig, counterDemoBlockSurface, createCounterDemoModel } from '../../../examples/docs/counter-block-demo.js';
import { dogfoodI18nCatalogsForLocale } from '../../../examples/docs/i18n/dogfood-catalog.js';
import { createStorybookApp, createStorybookFrameApp } from '../../../examples/docs/storybook-app.js';
import { normalizeViewOutput } from '../../../packages/bijou-tui/src/view-output.js';
import { CODE_SIZE_BASELINE } from '../../../scripts/code-size-gate.js';
import { splitModuleFamily } from './split-module-family.js';
import { TRANCHE_B_CLEARED_PATHS, TRANCHE_B_CODE_SIZE_PATHS } from './tranche-b-paths.js';

const ROOT = resolve(import.meta.dirname, '../../..');
const MAX_LINES = 150;
const MAX_BYTES = 12_000;

interface FileContextBaseline {
  readonly files: readonly Readonly<{ path: string }>[];
}

function readFileContextBaseline(): FileContextBaseline {
  const path = resolve(ROOT, 'scripts/code-dojo/baselines/file-context.json');
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (
    parsed == null
    || typeof parsed !== 'object'
    || !('files' in parsed)
    || !Array.isArray(parsed.files)
  ) {
    throw new Error('invalid file/context baseline');
  }
  return {
    files: parsed.files.map((entry: unknown) => {
      if (
        entry == null
        || typeof entry !== 'object'
        || !('path' in entry)
        || typeof entry.path !== 'string'
      ) {
        throw new Error('invalid file/context baseline entry');
      }
      return { path: entry.path };
    }),
  };
}

describe('DX-050 Code Dojo tranche B', () => {
  it('removes 25 counted violations and lowers the ceiling to 62', () => {
    const fileContextPaths = readFileContextBaseline().files.map(
      (entry) => entry.path,
    );
    const codeSizePaths = CODE_SIZE_BASELINE.map((entry) => entry.path);
    const packageJson: unknown = JSON.parse(
      readFileSync(resolve(ROOT, 'package.json'), 'utf8'),
    );
    if (
      packageJson == null
      || typeof packageJson !== 'object'
      || !('scripts' in packageJson)
      || packageJson.scripts == null
      || typeof packageJson.scripts !== 'object'
    ) {
      throw new Error('package.json scripts must be an object');
    }

    expect(TRANCHE_B_CLEARED_PATHS).toHaveLength(24);
    expect(TRANCHE_B_CODE_SIZE_PATHS).toHaveLength(1);
    expect(fileContextPaths).toHaveLength(37);
    expect(CODE_SIZE_BASELINE).toHaveLength(25);
    expect(packageJson.scripts).toHaveProperty(
      'code-dojo:debt',
      'tsx scripts/code-dojo-debt.ts --max 62',
    );
    for (const path of TRANCHE_B_CLEARED_PATHS) {
      expect(fileContextPaths, path).not.toContain(path);
    }
    for (const path of TRANCHE_B_CODE_SIZE_PATHS) {
      expect(codeSizePaths, path).not.toContain(path);
    }
  });

  it('keeps every extracted production module within the context gate', () => {
    for (const entrypoint of TRANCHE_B_CLEARED_PATHS) {
      const files = splitModuleFamily(resolve(ROOT, entrypoint));
      expect(files.length, entrypoint).toBeGreaterThan(1);
      for (const file of files) {
        const source = readFileSync(file, 'utf8');
        const lines = source.split(/\r?\n/u).length;
        const bytes = Buffer.byteLength(source, 'utf8');
        expect(
          lines <= MAX_LINES && bytes <= MAX_BYTES,
          `${file} is ${String(lines)} lines / ${String(bytes)} bytes`,
        ).toBe(true);
      }
    }
  });

  it('localizes the touched DOGFOOD counter and storybook surfaces', () => {
    const runtime = createI18nRuntime({
      locale: 'de',
      direction: 'ltr',
      catalogs: dogfoodI18nCatalogsForLocale('de'),
    });
    const localization = createRuntimeLocalizationPort(runtime);
    const counterCtx = createTestContext({
      mode: 'static',
      runtime: { columns: 80, rows: 24 },
    });
    const counter = counterDemoBlockSurface(counterDemoBlockConfig(
      createCounterDemoModel(5),
      counterCtx,
      70,
      localization,
    ));

    expect(stripAnsi(surfaceToString(counter, counterCtx.style)))
      .toContain('CounterDemoBlock statisch');

    const storybookCtx = createTestContext({
      mode: 'interactive',
      runtime: { columns: 120, rows: 40 },
    });
    const storybook = createStorybookApp(storybookCtx, { localization });
    const [model] = storybook.init();
    const storybookSurface = normalizeViewOutput(
      storybook.view(model),
      { width: 120, height: 40 },
    ).surface;

    expect(stripAnsi(surfaceToString(storybookSurface, storybookCtx.style)))
      .toContain('Katalog');

    const framedStorybook = createStorybookFrameApp(
      storybookCtx,
      { localization },
    );
    const [framedModel] = framedStorybook.init();
    const framedSurface = normalizeViewOutput(
      framedStorybook.view(framedModel),
      { width: 120, height: 40 },
    ).surface;

    expect(stripAnsi(surfaceToString(framedSurface, storybookCtx.style)))
      .toContain('Katalog');
  });
});
