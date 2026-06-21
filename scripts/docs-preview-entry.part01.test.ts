import {
  afterEach,
  createDocsApp,
  createNodeDocsApp,
  createTestContext,
  describe,
  DOGFOOD_NON_INTERACTIVE_MESSAGE,
  DOGFOOD_TERMINAL_NOTICE,
  dogfoodTerminalReadiness,
  execFileSync,
  expect,
  frameText,
  it,
  KEY_ENTER,
  KEY_F2,
  readFileSync,
  resolve,
  runScript,
  stripMarkdownFrontmatter,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

import { must } from '@flyingrobots/bijou/adapters/test';

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('uses the live local runtime entrypoint instead of the packaged build', () => {
    const source = readFileSync(new URL('../examples/docs/main.ts', import.meta.url), 'utf8');
    const nodeSource = readFileSync(new URL('../examples/docs/node-app.ts', import.meta.url), 'utf8');

    expect(source).toContain("../../packages/bijou-node/src/index.js");
    expect(nodeSource).toContain("../../packages/bijou-tui/src/index.js");
    expect(source).toContain("import { runNodeDocsApp } from './node-app.js';");
    expect(source).toContain('runNodeDocsApp(ctx');
    expect(source).toContain('dogfoodTerminalReadiness(ctx)');
    expect(source).toContain('DOGFOOD_TERMINAL_NOTICE');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('explains DOGFOOD terminal takeover and non-TTY failure modes', () => {
    const ready = dogfoodTerminalReadiness(createTestContext({
      runtime: { stdinIsTTY: true, stdoutIsTTY: true },
    }));
    const pipedStdout = dogfoodTerminalReadiness(createTestContext({
      runtime: { stdinIsTTY: true, stdoutIsTTY: false },
    }));
    const pipedStdin = dogfoodTerminalReadiness(createTestContext({
      runtime: { stdinIsTTY: false, stdoutIsTTY: true },
    }));

    expect(ready).toEqual({ ok: true });
    expect(pipedStdout).toEqual({ ok: false, message: DOGFOOD_NON_INTERACTIVE_MESSAGE });
    expect(pipedStdin).toEqual({ ok: false, message: DOGFOOD_NON_INTERACTIVE_MESSAGE });
    expect(DOGFOOD_NON_INTERACTIVE_MESSAGE).toContain('stdin and stdout');
    expect(DOGFOOD_NON_INTERACTIVE_MESSAGE).toContain('npm run smoke:dogfood');
    expect(DOGFOOD_TERMINAL_NOTICE).toContain('full-screen interactive TUI');
    expect(DOGFOOD_TERMINAL_NOTICE).toContain('press q');
    expect(DOGFOOD_TERMINAL_NOTICE).toContain('Ctrl-C');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('builds the Node DOGFOOD app through the locale adapter instead of process reads in view code', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createNodeDocsApp(ctx, { LC_ALL: 'fr_FR.UTF-8' });

    const result = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_F2 }], { ctx });

    expect(frameText(must(result.frames.at(-1)))).toContain('Langue préférée');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('imports the DOGFOOD app through the same tsx path used by npm run dogfood', () => {
    execFileSync(
      process.execPath,
      ['--import', 'tsx', '--input-type=module', '-e', "await import('./examples/docs/app.ts')"],
      {
        cwd: resolve(import.meta.dirname, '..'),
        stdio: 'pipe',
      },
    );
  }, 15_000);
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('strips Markdown frontmatter before DOGFOOD renders prose content', () => {
    expect(stripMarkdownFrontmatter([
      '---',
      'dogfood:',
      '  localization:',
      '    sourceLocale: en',
      '---',
      '# Start Here',
      '',
      'Visible guide body.',
    ].join('\n'))).toBe([
      '# Start Here',
      '',
      'Visible guide body.',
    ].join('\n'));
    expect(stripMarkdownFrontmatter('# Plain guide')).toBe('# Plain guide');
  });
});

describe('docs preview app', () => {
  afterEach(() => { _resetDefaultContextForTesting(); });

  it('builds the framed explorer shell from the provided ctx without relying on a default singleton', async () => {
    _resetDefaultContextForTesting();
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });

    const result = await runScript(app, [], { ctx });
    expect((result.model).route).toBe('docs');
  });
});
