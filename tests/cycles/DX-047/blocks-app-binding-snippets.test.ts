import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';
import {
  createScriptTestContext as createTestContext,
  runScriptDeterministic as runScript,
} from '../../helpers/scripted.js';
import {
  frameText,
  lastFrame,
  typecheck,
} from './blocks-app-binding-snippets-support.js';
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
const COUNTER_BINDING_SNIPPET_PATH = 'examples/docs/content/blocks-counter-app-binding.snippet.ts';
const SNIPPET_SUPPORT_PATH = 'tests/cycles/DX-047/blocks-app-binding-snippets-support.ts';
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
  const match = /```ts\n([\s\S]*?)\n```/.exec(section);
  if (match === null) {
    throw new Error(`Missing TypeScript code fence after heading: ${heading}`);
  }

  return match[1];
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
  afterEach(() => {
    _resetDefaultContextForTesting();
  });

  it('renders a CounterDemoBlock app-binding walkthrough in DOGFOOD Blocks docs', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 180, rows: 84 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' });

    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-make-your-own' },
      },
    }], { ctx });
    const text = frameText(lastFrame(result.frames));

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
    const canonicalSnippet = read(COUNTER_BINDING_SNIPPET_PATH).trim();

    expect(snippet).toBe(canonicalSnippet);

    for (const api of REQUIRED_COUNTER_BINDING_APIS) {
      expect(snippet).toContain(api);
    }

    expect(snippet).toContain('type CounterDemoModel');
    expect(snippet).toContain('CounterAppModel');
    expect(snippet).toContain('counterBlock: createCounterDemoModel(5)');

    expect(typecheck(ROOT, COUNTER_BINDING_SNIPPET_PATH)).toEqual([]);

    const relativeImports = [...snippet.matchAll(/from ['"](\.[^'"]+)['"]/g)]
      .map((match) => match[1]);
    expect(relativeImports).toEqual(['../counter-block-demo.js']);

    expect(typeof createCounterDemoModel).toBe('function');
    expect(typeof counterDemoIntentForKey).toBe('function');
    expect(typeof applyCounterDemoIntent).toBe('function');
    expect(typeof tickCounterDemoModel).toBe('function');
    expect(typeof counterDemoBlockConfig).toBe('function');
    expect(typeof counterDemoBlockSurface).toBe('function');
  });

  it('typechecks the binding snippet with the project test tsconfig', () => {
    const support = read(SNIPPET_SUPPORT_PATH);

    expect(support).toContain('ts.readConfigFile');
    expect(support).toContain('ts.parseJsonConfigFileContent');
    expect(support).not.toContain('ts.createProgram([rootFile], {');
  });
});
