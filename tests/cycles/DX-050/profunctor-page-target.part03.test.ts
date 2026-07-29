import { describe, expect, it } from 'vitest';
import {
  lowerProfunctorPageArtifacts,
  type ProfunctorPageInspectionMode,
} from '../../../packages/bijou/src/core/profunctor-page-target.js';
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
    }));
    expect(proof.targetMap.entries[4]).toMatchObject({
      renderNodeId: null,
      residual: {
        kind: 'hidden-unsupported-block',
        blockDefinitionId: 'block:future',
      },
    });
  });
});
