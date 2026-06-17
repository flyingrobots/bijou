import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';
import { _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import {
  applyCounterDemoIntent,
  counterDemoBlockConfig,
  counterDemoBlockSurface,
  counterDemoIntentForKey,
  createCounterDemoModel,
  tickCounterDemoModel,
} from '../../../examples/docs/counter-block-demo.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const BLOCKS_MAKE_YOUR_OWN_PATH = 'examples/docs/content/blocks-make-your-own.md';
const COUNTER_BINDING_HEADING = '## Bind CounterDemoBlock in an App';

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function extractFencedTsBlockAfterHeading(source: string, heading: string): string {
  const headingIndex = source.indexOf(heading);
  if (headingIndex === -1) {
    throw new Error(`Missing Markdown heading: ${heading}`);
  }

  const section = source.slice(headingIndex + heading.length);
  const match = section.match(/```ts\n([\s\S]*?)\n```/);
  if (match === null) {
    throw new Error(`Missing TypeScript code fence after heading: ${heading}`);
  }

  return match[1];
}

function resolveDocumentedSourceImport(markdownPath: string, importPath: string): string {
  const markdownDirectory = dirname(resolve(ROOT, markdownPath));
  const documentedTarget = resolve(markdownDirectory, importPath);
  return documentedTarget.endsWith('.js')
    ? documentedTarget.replace(/\.js$/, '.ts')
    : documentedTarget;
}

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

const REQUIRED_COUNTER_BINDING_APIS = [
  'createCounterDemoModel',
  'counterDemoIntentForKey',
  'applyCounterDemoIntent',
  'tickCounterDemoModel',
  'counterDemoBlockConfig',
  'counterDemoBlockSurface',
] as const;

describe('DX-047 Blocks app-binding snippets', () => {
  afterEach(() => _resetDefaultContextForTesting());

  it('renders a CounterDemoBlock app-binding walkthrough in DOGFOOD Blocks docs', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 84 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });

    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-make-your-own' },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('Bind CounterDemoBlock in an App');
    expect(text).toContain('App owns CounterDemoModel state');
    expect(text).toContain('keys become command intents');
    expect(text).toContain('counterDemoIntentForKey');
    expect(text).toContain('applyCounterDemoIntent');
    expect(text).toContain('counterDemoBlockConfig');
    expect(text).toContain('counterDemoBlockSurface');
    expect(text).toContain('pipe and accessible modes');
  });

  it('keeps the documented binding snippet anchored to real CounterDemoBlock helpers', () => {
    const source = read(BLOCKS_MAKE_YOUR_OWN_PATH);
    const snippet = extractFencedTsBlockAfterHeading(source, COUNTER_BINDING_HEADING);

    for (const api of REQUIRED_COUNTER_BINDING_APIS) {
      expect(snippet).toContain(api);
    }

    expect(snippet).toContain('type CounterDemoModel');
    expect(snippet).toContain('CounterAppModel');
    expect(snippet).toContain('counterBlock: createCounterDemoModel(5)');

    const transpiled = ts.transpileModule(snippet, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });
    expect(transpiled.diagnostics ?? []).toEqual([]);

    const relativeImports = [...snippet.matchAll(/from ['"](\.[^'"]+)['"]/g)]
      .map((match) => match[1]);
    expect(relativeImports).toEqual(['../counter-block-demo.js']);
    for (const importPath of relativeImports) {
      const sourcePath = resolveDocumentedSourceImport(BLOCKS_MAKE_YOUR_OWN_PATH, importPath);
      expect(existsSync(sourcePath)).toBe(true);
    }

    expect(typeof createCounterDemoModel).toBe('function');
    expect(typeof counterDemoIntentForKey).toBe('function');
    expect(typeof applyCounterDemoIntent).toBe('function');
    expect(typeof tickCounterDemoModel).toBe('function');
    expect(typeof counterDemoBlockConfig).toBe('function');
    expect(typeof counterDemoBlockSurface).toBe('function');
  });
});
