import { describe, expect, it } from 'vitest';
import {
  lowerProfunctorPageArtifacts,
  type ProfunctorPageInspectionMode,
  ProfunctorPageTargetError,
} from '../../../packages/bijou/src/core/profunctor-page-target.js';
import { validatePageSceneBounds } from '../../../packages/bijou/src/core/profunctor-page-scene-bounds.js';
import type { PlannedPageNode } from '../../../packages/bijou/src/core/profunctor-page-scene.js';
import { fixtureInputs, mutatePage, recordAt } from './profunctor-page-target.test-support.js';

describe('DX-050 terminal inspection evidence', () => {
  it('preserves headings, landmarks, tokens, and link destinations as facts', () => {
    const proof = lowerProfunctorPageArtifacts(fixtureInputs());
    expect(proof.targetMap.outline.map((item) => item.text)).toEqual([
      'Keep',
      'One project identity, every surface.',
      'Documentation stays beside implementation.',
      'Nearby projects in Rust.',
    ]);
    expect(proof.targetMap.landmarks).toEqual([
      {
        pageNodeId: 'page-node:project.keep#project-page.root',
        role: 'main',
      },
    ]);
    expect(proof.targetMap.tokenRefs).toContain('semantic.interactive');
    expect(proof.targetMap.actions.map((action) => action.target)).toEqual([
      'https://github.com/flyingrobots/keep#readme',
      'https://github.com/flyingrobots/keep',
      'https://github.com/flyingrobots/keep#readme',
      '/projects/bunny/',
      '/projects/geordi/',
      '/projects/nine-lives/',
    ]);
    expect(proof.witness).toContain('Content-addressed storage library.');
  });

  it.each<[ProfunctorPageInspectionMode, string]>([
    ['node-ids', 'page-node:project.keep#project-page.root'],
    ['source-refs', 'source-occurrence:projectCatalog.keep#record'],
    ['token-refs', 'semantic.interactive'],
    ['composition', 'template:project-page.root'],
    ['obstructions', 'semantic-html'],
  ])('emits deterministic %s diagnostic evidence', (mode, expected) => {
    const first = lowerProfunctorPageArtifacts(fixtureInputs(), { mode });
    const second = lowerProfunctorPageArtifacts(fixtureInputs(), { mode });
    expect(first.artifacts).toEqual(second.artifacts);
    expect(first.receipt.mode).toBe(mode);
    expect(first.witness).toContain(expected);
  });

  it('wraps token facts without overlapping the following page node', () => {
    const proof = lowerProfunctorPageArtifacts(fixtureInputs(), {
      mode: 'token-refs',
    });
    for (const token of proof.targetMap.tokenRefs) {
      expect(proof.witness).toContain(`token · ${token}`);
    }
    const rootRows = proof.targetMap.cellSourceMap
      .filter((entry) => entry.nodeId.includes('project-page.root/line-'))
      .map((entry) => entry.y);
    const heroRows = proof.targetMap.cellSourceMap
      .filter((entry) => entry.nodeId.includes('project-page.hero/line-'))
      .map((entry) => entry.y);
    expect(Math.min(...heroRows)).toBeGreaterThan(Math.max(...rootRows));
  });

  it('residualizes an unsupported hidden block explicitly', () => {
    const proof = lowerProfunctorPageArtifacts(mutatePage((page) => {
      const node = recordAt(page.nodes, 4);
      node.blockDefinitionId = 'block:future';
      node.hidden = true;
      recordAt([node.props], 0).sourceProvenance = null;
    }));
    expect(proof.targetMap.entries[4]).toMatchObject({
      renderNodeId: null,
      residual: {
        kind: 'hidden-unsupported-block',
        blockDefinitionId: 'block:future',
      },
    });
  });

  it('rejects lines that escape their assigned non-root region', () => {
    const plan = {
      node: {
        blockDefinitionId: 'block:test',
        contentNodeId: null,
        hidden: false,
        pageNodeId: 'page-node:test',
        props: {},
        requiredCapabilities: [],
        slots: [],
        sourceBindings: {},
        templateNodeId: 'template:test',
        tokens: {},
      },
      renderNodeId: 'bijou-render:page-node:test',
      region: { x: 5, y: 2, width: 2, height: 1 },
      lines: [{ text: 'abc' }],
      lineIds: ['bijou-render-line:page-node:test/0'],
    } satisfies PlannedPageNode;
    expectUnsupportedPlan(plan);
    expectUnsupportedPlan({
      ...plan,
      region: { ...plan.region, width: 3 },
      lines: [...plan.lines, { text: 'x' }],
      lineIds: [...plan.lineIds, 'bijou-render-line:page-node:test/1'],
    });
  });
});

function expectUnsupportedPlan(plan: PlannedPageNode): void {
  expect(() => {
    validatePageSceneBounds([plan], 'page-node:root', 100, 28);
  }).toThrow(
    expect.objectContaining<Partial<ProfunctorPageTargetError>>({
      code: 'BIJOU_PAGE_BLOCK_UNSUPPORTED',
    }),
  );
}
