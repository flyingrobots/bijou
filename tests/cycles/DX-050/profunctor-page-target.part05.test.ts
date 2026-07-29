import { describe, expect, it } from 'vitest';
import {
  lowerProfunctorPageArtifacts,
  ProfunctorPageTargetError,
} from '../../../packages/bijou/src/core/profunctor-page-target.js';
import {
  mutatePage,
  recordAt,
  records,
  strings,
} from './profunctor-page-target.test-support.js';

describe('DX-050 page composition graph validation', () => {
  it('rejects graphs that are not rooted in reading order', () => {
    expectInvalid(mutatePage((page) => {
      const readingOrder = strings(page.readingOrder);
      page.readingOrder = [
        readingOrder[1],
        readingOrder[0],
        ...readingOrder.slice(2),
      ];
    }));
    expectInvalid(mutatePage((page) => {
      const root = recordAt(page.nodes, 0);
      const hero = recordAt(page.nodes, 1);
      const facts = recordAt(page.nodes, 2);
      const rootSlots = records(root.slots);
      recordAt(rootSlots, 0).childPageNodeIds = [];
      recordAt(rootSlots, 1).childPageNodeIds = [];
      hero.slots = [{
        childPageNodeIds: [facts.pageNodeId],
        name: 'cycle-child',
      }];
      facts.slots = [{
        childPageNodeIds: [hero.pageNodeId],
        name: 'cycle-child',
      }];
    }));
  });
});

function expectInvalid(
  inputs: Parameters<typeof lowerProfunctorPageArtifacts>[0],
): void {
  expect(() => lowerProfunctorPageArtifacts(inputs)).toThrow(
    expect.objectContaining<Partial<ProfunctorPageTargetError>>({
      code: 'BIJOU_PAGE_INPUT_REFERENCE_INVALID',
    }),
  );
}
