import { describe, expect, it } from 'vitest';
import {
  bindSchemaBlockInput,
  isSchemaBoundBlockDefinition,
  lintModeLowering,
  validateBlockMetadata,
} from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { runScript } from '@flyingrobots/bijou-tui';
import { createDocsApp } from '../../../examples/docs/app.js';
import {
  defaultDogfoodBlockRegistry,
  dogfoodDocsSurfaceBlock,
  dogfoodDocsSurfaceBlockRegistryEntry,
  dogfoodDocsSurfaceSchemaBlock,
} from '../../../examples/docs/dogfood-blocks.js';

describe('DF-030 DOGFOOD docs surface Block', () => {
  it('publishes the canonical DOGFOOD docs surface as a schema-bound Block', () => {
    expect(validateBlockMetadata(dogfoodDocsSurfaceBlock.metadata).passed).toBe(true);
    expect(dogfoodDocsSurfaceBlock.metadata.blockName).toBe('DogfoodDocsSurfaceBlock');
    expect(dogfoodDocsSurfaceBlock.metadata.family).toBe('docs-surface');
    expect(dogfoodDocsSurfaceBlock.metadata.scale).toBe('workspace');
    expect(dogfoodDocsSurfaceBlock.metadata.modes).toEqual([
      'interactive',
      'static',
      'pipe',
      'accessible',
    ]);
    expect(dogfoodDocsSurfaceBlock.data?.names()).toEqual([
      'docsTree',
      'selectedRoute',
      'searchState',
      'proofArtifacts',
    ]);
    expect(dogfoodDocsSurfaceBlock.commands?.map((intent) => intent.id)).toEqual([
      'docs.navigate',
      'docs.search',
      'docs.openProof',
      'docs.copyLink',
    ]);

    expect(isSchemaBoundBlockDefinition(dogfoodDocsSurfaceSchemaBlock)).toBe(true);
    expect(dogfoodDocsSurfaceSchemaBlock.block).toBe(dogfoodDocsSurfaceBlock);
    expect(dogfoodDocsSurfaceSchemaBlock.schema.describe?.()).toMatchObject({
      requiredFields: ['docsTree', 'selectedRoute', 'selectedHeadingId', 'searchState', 'proofArtifacts'],
      facts: [{ kind: 'entity', key: 'block.schema', value: 'DogfoodDocsSurfaceBlock' }],
    });
  });

  it('validates unknown docs-surface input before binding render config', () => {
    const bound = bindSchemaBlockInput(dogfoodDocsSurfaceSchemaBlock, dogfoodDocsFixture());

    expect(bound).toMatchObject({
      ok: true,
      input: {
        config: {
          docsTree: ['Guides', 'Blocks', 'Packages'],
          selectedRoute: 'blocks',
          selectedHeadingId: 'blocks',
          searchState: { query: 'table', hitCount: 2 },
          proofArtifacts: [{
            id: 'table-demo.gif',
            label: 'table-demo.gif',
            available: true,
          }],
        },
      },
    });
    expect(bound.facts).toEqual(expect.arrayContaining([
      { kind: 'entity', key: 'route', value: 'blocks' },
      { kind: 'entity', key: 'heading-id', value: 'blocks' },
      { kind: 'count', key: 'search-hit-count', value: 2 },
      { kind: 'entity', key: 'proof-artifact', value: 'table-demo.gif' },
    ]));

    expect(bindSchemaBlockInput(dogfoodDocsSurfaceSchemaBlock, {
      selectedRoute: 'blocks',
    })).toMatchObject({
      ok: false,
      issues: [{
        severity: 'error',
        code: 'dogfood.docsSurface.invalid',
      }],
    });
  });

  it('rejects accessor-backed docs-surface input without invoking getters', () => {
    let getterCalls = 0;
    const accessorInput = Object.defineProperties({}, {
      docsTree: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return ['Guides'];
        },
      },
      selectedRoute: {
        enumerable: true,
        get() {
          getterCalls += 1;
          return 'guides';
        },
      },
    });

    expect(bindSchemaBlockInput(dogfoodDocsSurfaceSchemaBlock, accessorInput)).toMatchObject({
      ok: false,
    });
    expect(getterCalls).toBe(0);
  });

  it('rejects accessor-backed docs-surface arrays without invoking nested getters', () => {
    let getterCalls = 0;
    const docsTree = Object.defineProperty([], '0', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return 'Guides';
      },
    });
    const proofArtifacts = Object.defineProperty([], '0', {
      enumerable: true,
      get() {
        getterCalls += 1;
        return {
          id: 'table-demo.gif',
          label: 'table-demo.gif',
          available: true,
        };
      },
    });

    expect(bindSchemaBlockInput(dogfoodDocsSurfaceSchemaBlock, {
      docsTree,
      selectedRoute: 'blocks',
      selectedHeadingId: 'blocks',
      searchState: { query: 'table', hitCount: 2 },
      proofArtifacts,
    })).toMatchObject({
      ok: false,
    });
    expect(getterCalls).toBe(0);
  });

  it('renders visual and lower modes with stable route, heading, search, and proof facts', () => {
    const config = dogfoodDocsFixture();
    const modes = ['interactive', 'static', 'pipe', 'accessible'] as const;
    const renderedByMode = modes.map((mode) => ({
      mode,
      rendered: dogfoodDocsSurfaceBlock.render({ mode, config }),
    }));

    expect(String(renderedByMode.find((entry) => entry.mode === 'interactive')?.rendered.output))
      .toContain('DOGFOOD Docs Surface');
    expect(String(renderedByMode.find((entry) => entry.mode === 'static')?.rendered.output))
      .toContain('| search: table (2 hits) | proof: table-demo.gif available');
    expect(String(renderedByMode.find((entry) => entry.mode === 'pipe')?.rendered.output))
      .toBe('route\theading\tsearch-hit-count\tproofs\nblocks\tblocks\t2\ttable-demo.gif');
    expect(String(renderedByMode.find((entry) => entry.mode === 'accessible')?.rendered.output))
      .toContain('DOGFOOD docs surface. Blocks page selected.');

    const report = lintModeLowering({
      modes: renderedByMode.map(({ mode, rendered }) => ({
        mode,
        facts: rendered.facts ?? [],
      })),
    });
    expect(report).toMatchObject({ passed: true });

    for (const { rendered } of renderedByMode) {
      expect(rendered.facts).toEqual(expect.arrayContaining([
        { kind: 'entity', key: 'dogfood.block', value: 'DogfoodDocsSurfaceBlock' },
        { kind: 'entity', key: 'route', value: 'blocks' },
        { kind: 'entity', key: 'heading-id', value: 'blocks' },
        { kind: 'count', key: 'search-hit-count', value: 2 },
        { kind: 'entity', key: 'proof-artifact', value: 'table-demo.gif' },
      ]));
    }
  });

  it('keeps proof artifact fact identity stable when labels are display-only', () => {
    const rendered = dogfoodDocsSurfaceBlock.render({
      mode: 'accessible',
      config: {
        docsTree: ['Guides', 'Blocks', 'Packages'],
        selectedRoute: 'blocks',
        selectedHeadingId: 'blocks',
        selectedRouteLabel: 'Blocks',
        searchState: { query: 'table', hitCount: 2 },
        proofArtifacts: [{
          id: 'capture.table-demo',
          label: 'Table demo capture',
          available: true,
        }],
      },
    });

    expect(rendered.output).toContain('Proof artifacts: Table demo capture.');
    expect(rendered.facts).toContainEqual({
      kind: 'entity',
      key: 'proof-artifact',
      value: 'capture.table-demo',
    });
  });

  it('emits one machine-facing proof fact per available artifact id', () => {
    const rendered = dogfoodDocsSurfaceBlock.render({
      mode: 'pipe',
      config: {
        docsTree: ['Guides', 'Blocks', 'Packages'],
        selectedRoute: 'blocks',
        selectedHeadingId: 'blocks',
        selectedRouteLabel: 'Blocks',
        searchState: { query: 'table', hitCount: 2 },
        proofArtifacts: [
          {
            id: 'capture.table-demo',
            label: 'Table demo capture',
            available: true,
          },
          {
            id: 'capture.block-registry',
            label: 'Block registry screenshot',
            available: true,
          },
          {
            id: 'capture.future-proof',
            label: 'Future proof',
            available: false,
          },
        ],
      },
    });

    expect(rendered.output).toBe([
      'route\theading\tsearch-hit-count\tproofs',
      'blocks\tblocks\t2\tcapture.table-demo, capture.block-registry',
    ].join('\n'));
    expect(rendered.output).not.toContain('Table demo capture');
    expect(rendered.facts?.filter((fact) => fact.key === 'proof-artifact')).toEqual([
      { kind: 'entity', key: 'proof-artifact', value: 'capture.table-demo' },
      { kind: 'entity', key: 'proof-artifact', value: 'capture.block-registry' },
    ]);
  });

  it('rejects blank docs-surface identifiers at the schema boundary', () => {
    for (const patch of [
      { selectedRoute: '' },
      { selectedRoute: '   ' },
      { selectedHeadingId: '' },
      { selectedRouteLabel: '' },
      { proofArtifacts: [{ id: '', label: 'Table demo capture', available: true }] },
    ]) {
      expect(bindSchemaBlockInput(dogfoodDocsSurfaceSchemaBlock, {
        ...dogfoodDocsFixture(),
        ...patch,
      })).toMatchObject({
        ok: false,
        issues: [{
          severity: 'error',
          code: 'dogfood.docsSurface.invalid',
        }],
      });
    }
  });

  it('registers the docs surface in DOGFOOD inventory and product docs', async () => {
    expect(dogfoodDocsSurfaceBlockRegistryEntry.block).toBe(dogfoodDocsSurfaceBlock);
    expect(dogfoodDocsSurfaceBlockRegistryEntry.role).toBe('app-shell');
    expect(defaultDogfoodBlockRegistry.forSurface('docs.surface')).toBe(
      dogfoodDocsSurfaceBlockRegistryEntry,
    );

    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 140 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs', initialPageId: 'blocks' as any });
    const result = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: { type: 'select-guide', guideId: 'blocks-dogfood-surfaces' },
      },
    }], { ctx });
    const text = frameText(result.frames.at(-1)!);

    expect(text).toContain('DogfoodDocsSurfaceBlock');
    expect(text).toContain('-> docs.surface (app-shell)');
    expect(text).toContain('DOGFOOD docs, navigation, search, reader, and proof artifact surface.');
    expect(text).toContain('Rendered preview');
    expect(text).toContain('DOGFOOD Docs Surface');
    expect(text).toContain('proof: table-demo.gif available');
  });
});

function dogfoodDocsFixture() {
  return {
    docsTree: ['Guides', 'Blocks', 'Packages'],
    selectedRoute: 'blocks',
    selectedHeadingId: 'blocks',
    selectedRouteLabel: 'Blocks',
    searchState: { query: 'table', hitCount: 2 },
    proofArtifacts: [{
      id: 'table-demo.gif',
      label: 'table-demo.gif',
      available: true,
    }],
  };
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
