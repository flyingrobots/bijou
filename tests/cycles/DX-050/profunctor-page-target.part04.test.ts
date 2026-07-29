import { describe, expect, it } from 'vitest';
import {
  lowerProfunctorPageArtifacts,
  ProfunctorPageTargetError,
} from '../../../packages/bijou/src/core/profunctor-page-target.js';
import {
  fixtureInputs,
  mutateBuildManifest,
  mutatePage,
  mutateSourceMap,
  recordAt,
  strings,
} from './profunctor-page-target.test-support.js';

const HOST_LOCAL_SOURCE_PATH = ['', 'Users', 'example', 'project-registry.js']
  .join('/');

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
    expectInvalid(mutatePage((page) => {
      page.tokenRefs = [...strings(page.tokenRefs), 'surface'];
    }));
    expectInvalid(mutatePage((page) => {
      page.tokenRefs = [...strings(page.tokenRefs), 'surface'];
      recordAt(page.nodes, 0).tokens = { surface: 'surface' };
    }));
  });

  it('rejects malformed structured source-map entries', () => {
    expectInvalid(mutateSourceMap((sourceMap) => {
      const entry = recordAt(sourceMap.entries, 0);
      recordAt([entry.source], 0).path = HOST_LOCAL_SOURCE_PATH;
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
    expectInvalid(mutateSourceMap((sourceMap) => {
      const source = recordAt([recordAt(sourceMap.entries, 0).source], 0);
      source.parserProfile = 'typescript-estree@1';
      delete source.spanResidual;
      source.span = {
        end: { column: 1, line: 1, offset: 1 },
        start: { column: 1, line: 10, offset: 100 },
      };
      source.spanResidual = null;
    }));
  });

  it('rejects missing build-manifest contract fields', () => {
    expectInvalid(mutateBuildManifest((manifest) => {
      delete manifest.compiler;
    }));
  });

  it('rejects unsafe or contradictory ProjectPage facts', () => {
    expectInvalid(mutatePage((page) => {
      const root = recordAt(page.nodes, 0);
      recordAt([root.props], 0).sourceProvenance = {
        exportName: 'projectCatalog',
        recordId: 'keep',
        sourceDigest: `sha256:${'0'.repeat(64)}`,
        sourcePath: HOST_LOCAL_SOURCE_PATH,
      };
    }));
    expectInvalid(mutatePage((page) => {
      const hero = recordAt(page.nodes, 1);
      recordAt([hero.props], 0).documentationUrl = 'javascript:alert(1)';
    }));
    expectCode(mutatePage((page) => {
      const root = recordAt(page.nodes, 0);
      recordAt([root.props], 0).route = '/projects/not-keep/';
    }), 'BIJOU_PAGE_INPUT_IDENTITY_MISMATCH');
    expectInvalid(mutatePage((page) => {
      recordAt(page.nodes, 0).hidden = true;
    }));
  });

  it('rejects undeclared digests and obstructed builds', () => {
    const undeclaredDigest = `sha256:${'0'.repeat(64)}`;
    expectCode(mutateSourceMap((sourceMap) => {
      const entry = recordAt(sourceMap.entries, 0);
      recordAt([entry.source], 0).sourceDigest = undeclaredDigest;
    }), 'BIJOU_PAGE_INPUT_IDENTITY_MISMATCH');
    expectCode(mutatePage((page) => {
      const root = recordAt(page.nodes, 0);
      recordAt([recordAt([root.props], 0).sourceProvenance], 0).sourceDigest =
        undeclaredDigest;
    }), 'BIJOU_PAGE_INPUT_IDENTITY_MISMATCH');
    expectCode(mutateBuildManifest((manifest) => {
      recordAt([manifest.entity], 0).entityDigest = undeclaredDigest;
    }), 'BIJOU_PAGE_INPUT_IDENTITY_MISMATCH');
    expectCode(mutateBuildManifest((manifest) => {
      manifest.obstructions = [{ code: 'source-obstructed' }];
    }), 'BIJOU_PAGE_BLOCK_UNSUPPORTED');
  });

  it('rejects unsupported inspection modes at the public boundary', () => {
    expect(() => {
      Reflect.apply(
        lowerProfunctorPageArtifacts,
        undefined,
        [fixtureInputs(), { mode: 'unknown' }],
      );
    }).toThrow(
      expect.objectContaining<Partial<ProfunctorPageTargetError>>({
        code: 'BIJOU_PAGE_INPUT_REFERENCE_INVALID',
        path: 'options.mode',
      }),
    );
  });
});

function expectInvalid(inputs: Parameters<typeof lowerProfunctorPageArtifacts>[0]): void {
  expectCode(inputs, 'BIJOU_PAGE_INPUT_REFERENCE_INVALID');
}

function expectCode(
  inputs: Parameters<typeof lowerProfunctorPageArtifacts>[0],
  code: ProfunctorPageTargetError['code'],
): void {
  expect(() => lowerProfunctorPageArtifacts(inputs)).toThrow(
    expect.objectContaining<Partial<ProfunctorPageTargetError>>({
      code,
    }),
  );
}
