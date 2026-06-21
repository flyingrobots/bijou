import { describe, expect, it } from 'vitest';
import { bindSchemaBlockInput, lintModeLowering } from '@flyingrobots/bijou';
import { dogfoodDocsSurfaceBlock, dogfoodDocsSurfaceSchemaBlock } from '../../../examples/docs/dogfood-blocks.js';

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

describe('DF-030 DOGFOOD docs surface Block', () => {
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
});
