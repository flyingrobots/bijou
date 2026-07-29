import { describe, expect, it } from 'vitest';
import {
  lowerProfunctorPageArtifacts,
  type ProfunctorPageTargetMap,
} from '../../../packages/bijou/src/core/profunctor-page-target.js';
import {
  fixtureInputs,
  generatedSource,
  mutatePage,
  mutatePageAndSourceMap,
  recordAt,
  records,
  sha256,
} from './profunctor-page-target.test-support.js';

describe('DX-050 Profunctor Page target proof', () => {
  it('pins the canonical website artifact family', () => {
    const inputs = fixtureInputs();
    expect(sha256(inputs.page.source)).toBe(
      'sha256:12b90184b4e238bc6bd7db944af8651900b830ea76ba775ab7c7ee20be051e73',
    );
    expect(sha256(inputs.sourceMap.source)).toBe(
      'sha256:a40e97f2fd513519092d2a131c0d7107517b92bd7e9cfd5e79df70a65a3fe044',
    );
    expect(sha256(inputs.buildManifest.source)).toBe(
      'sha256:975efc9c701cbd7a6981787150748b76d1e53fd83cd424128667bc8014687ab7',
    );
  });

  it('emits deterministic Bijou-owned scene, map, receipt, and witness bytes', () => {
    const first = lowerProfunctorPageArtifacts(fixtureInputs());
    const second = lowerProfunctorPageArtifacts(fixtureInputs());
    expect(first.artifacts).toEqual(second.artifacts);
    expect(first.scene.irVersion).toBe('ui-scene-ir/1');
    expect(first.targetMap.artifactVersion).toBe(
      'bijou-profunctor-page-map/1',
    );
    expect(first.receipt.artifactVersion).toBe(
      'bijou-profunctor-page-receipt/1',
    );
    expect(first.receipt.upstreamClaimsInherited).toBe(false);
    expect(first.artifacts.scene.source).toBe(
      `${JSON.stringify(first.scene)}\n`,
    );
  });

  it('maps every visible page node injectively in reading order', () => {
    const proof = lowerProfunctorPageArtifacts(fixtureInputs());
    expect(proof.targetMap.entries).toHaveLength(5);
    expect(proof.targetMap.entries.map((entry) => entry.pageNodeId)).toEqual(
      proof.targetMap.readingOrder,
    );
    expect(new Set(renderedIds(proof.targetMap)).size).toBe(5);
    expect(proof.targetMap.entries.every(
      (entry) => (entry.renderNodeId == null) !== (entry.residual == null),
    )).toBe(true);
    expect(proof.targetMap.sourceOccurrences).toEqual([
      'source-occurrence:projectCatalog.keep#fact.title',
      'source-occurrence:projectCatalog.keep#record',
    ]);
    expect(proof.targetMap.cellSourceMap.length).toBeGreaterThan(0);
    expect(proof.targetMap.cellSourceMap.some(
      (entry) => entry.source?.includes('source-occurrence:projectCatalog.keep'),
    )).toBe(true);
  });

  it('preserves composition and content identities in target facts', () => {
    const proof = lowerProfunctorPageArtifacts(mutatePage((page) => {
      const contentNodeId = 'content:project.keep#summary';
      page.contentRefs = [contentNodeId];
      recordAt(page.nodes, 1).contentNodeId = contentNodeId;
    }));
    expect(proof.targetMap.compositionRef).toBe('composition:project-page@0');
    expect(proof.targetMap.entries[1]?.contentNodeId).toBe(
      'content:project.keep#summary',
    );
    expect(
      lowerProfunctorPageArtifacts(fixtureInputs(), { mode: 'composition' })
        .witness,
    ).toContain('composition:project-page@0');
  });

  it('accepts multiple structured source occurrences owned by one page node', () => {
    const secondOccurrence = 'source-occurrence:projectCatalog.keep#fact.summary';
    const proof = lowerProfunctorPageArtifacts(mutatePageAndSourceMap(
      (page) => {
        recordAt(page.nodes, 0).sourceBindings = {
          record: 'source-occurrence:projectCatalog.keep#record',
          summary: secondOccurrence,
        };
      },
      (sourceMap) => {
        const entries = records(sourceMap.entries);
        entries.push({
          ...recordAt(entries, 0),
          sourceOccurrenceId: secondOccurrence,
        });
      },
    ));
    expect(proof.targetMap.sourceOccurrences).toContain(secondOccurrence);
  });

  it('keeps the checked target evidence byte-identical to the lowerer', () => {
    const proof = lowerProfunctorPageArtifacts(fixtureInputs());
    for (const artifact of Object.values(proof.artifacts)) {
      expect(generatedSource(artifact.filename)).toBe(artifact.source);
    }
  });
});

function renderedIds(targetMap: ProfunctorPageTargetMap): string[] {
  return targetMap.entries.flatMap(
    (entry) => entry.renderNodeId == null ? [] : [entry.renderNodeId],
  );
}
