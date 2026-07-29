import { describe, expect, it } from 'vitest';
import {
  lowerProfunctorPageArtifacts,
  ProfunctorPageTargetError,
} from '../../../packages/bijou/src/core/profunctor-page-target.js';
import {
  mutateBuildManifest,
  mutatePage,
  mutateSourceMap,
  recordAt,
} from './profunctor-page-target.test-support.js';

describe('DX-050 canonical contract validation', () => {
  it('rejects missing, unowned, and malformed page fields', () => {
    expectInvalid(mutatePage((page) => {
      page.unownedField = true;
    }));
    expectInvalid(mutatePage((page) => {
      delete page.applicationIslands;
    }));
    expectInvalid(mutatePage((page) => {
      page.pageId = 'page:';
    }));
    expectInvalid(mutatePage((page) => {
      recordAt(page.nodes, 0).sourceBindings = {
        '': 'source-occurrence:projectCatalog.keep#record',
      };
    }));
  });

  it('rejects malformed structured source-map entries', () => {
    expectInvalid(mutateSourceMap((sourceMap) => {
      const entry = recordAt(sourceMap.entries, 0);
      recordAt([entry.source], 0).path = '/Users/example/project-registry.js';
    }));
    expectInvalid(mutateSourceMap((sourceMap) => {
      delete recordAt(sourceMap.entries, 0).sourceOccurrenceId;
    }));
    expectInvalid(mutateSourceMap((sourceMap) => {
      recordAt(sourceMap.entries, 0).renderNodeId = 'render:';
    }));
    expectInvalid(mutateSourceMap((sourceMap) => {
      recordAt(sourceMap.entries, 0).residual = {
        kind: 'unclassified',
        reason: 'unknown',
      };
    }));
  });

  it('rejects missing build-manifest contract fields', () => {
    expectInvalid(mutateBuildManifest((manifest) => {
      delete manifest.compiler;
    }));
  });
});

function expectInvalid(inputs: Parameters<typeof lowerProfunctorPageArtifacts>[0]): void {
  expect(() => lowerProfunctorPageArtifacts(inputs)).toThrow(
    expect.objectContaining<Partial<ProfunctorPageTargetError>>({
      code: 'BIJOU_PAGE_INPUT_REFERENCE_INVALID',
    }),
  );
}
