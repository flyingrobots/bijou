import { describe, expect, it } from 'vitest';
import {
  lowerProfunctorPageArtifacts,
  ProfunctorPageTargetError,
} from '../../../packages/bijou/src/core/profunctor-page-target.js';
import {
  fixtureInputs,
  mutatePage,
  mutateSourceMap,
  recordAt,
  records,
} from './profunctor-page-target.test-support.js';

describe('DX-050 fail-closed input validation', () => {
  it('rejects invalid JSON and unsupported versions with stable diagnostics', () => {
    expectCode(
      () => lowerProfunctorPageArtifacts({
        ...fixtureInputs(),
        page: { filename: 'page.json', source: '{' },
      }),
      'BIJOU_PAGE_INPUT_JSON_INVALID',
    );
    expectCode(
      () => lowerProfunctorPageArtifacts(mutatePage((page) => {
        page.artifactVersion = 'profunctor-page/1';
      })),
      'BIJOU_PAGE_INPUT_VERSION_UNSUPPORTED',
    );
  });

  it('rejects digest and cross-artifact identity drift', () => {
    const inputs = fixtureInputs();
    expectCode(
      () => lowerProfunctorPageArtifacts({
        ...inputs,
        page: { ...inputs.page, source: inputs.page.source.replace('Keep', 'Kept') },
      }),
      'BIJOU_PAGE_INPUT_DIGEST_MISMATCH',
    );
    expectCode(
      () => lowerProfunctorPageArtifacts(mutateSourceMap((sourceMap) => {
        sourceMap.pageId = 'page:project.other';
      })),
      'BIJOU_PAGE_INPUT_IDENTITY_MISMATCH',
    );
  });

  it('rejects duplicate nodes, broken reading order, and source-map drift', () => {
    expectCode(
      () => lowerProfunctorPageArtifacts(mutatePage((page) => {
        const nodes = records(page.nodes);
        nodes.push({ ...records(page.nodes)[0] });
      })),
      'BIJOU_PAGE_INPUT_REFERENCE_INVALID',
    );
    expectCode(
      () => lowerProfunctorPageArtifacts(mutatePage((page) => {
        page.readingOrder = records(page.nodes).slice(0, 4)
          .map((node) => node.pageNodeId);
      })),
      'BIJOU_PAGE_INPUT_REFERENCE_INVALID',
    );
    expectCode(
      () => lowerProfunctorPageArtifacts(mutateSourceMap((sourceMap) => {
        recordAt(sourceMap.entries, 0).templateNodeId = 'template:wrong';
      })),
      'BIJOU_PAGE_INPUT_IDENTITY_MISMATCH',
    );
  });

  it('rejects unsupported visible blocks instead of approximating them', () => {
    expectCode(
      () => lowerProfunctorPageArtifacts(mutatePage((page) => {
        recordAt(page.nodes, 1).blockDefinitionId = 'block:unknown';
      })),
      'BIJOU_PAGE_BLOCK_UNSUPPORTED',
    );
  });
});

function expectCode(run: () => unknown, code: string): void {
  try {
    run();
    throw new Error(`Expected ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(ProfunctorPageTargetError);
    if (!(error instanceof ProfunctorPageTargetError)) {
      throw error;
    }
    expect(error.code).toBe(code);
  }
}
