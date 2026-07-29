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

  it('rejects content that exceeds the bounded terminal surface', () => {
    expectUnsupported(mutatePage((page) => {
      const root = recordAt(page.nodes, 0);
      recordAt([root.props], 0).displayTitle = 'x'.repeat(101);
    }));
    expectUnsupported(mutatePage((page) => {
      const relatedNode = recordAt(page.nodes, 4);
      const relatedProjects = records(
        recordAt([relatedNode.props], 0).relatedProjects,
      );
      const seed = recordAt(relatedProjects, 0);
      for (let index = 0; index < 30; index++) {
        relatedProjects.push({
          ...seed,
          displayTitle: `Project ${String(index)}`,
          entityId: `entity:project.item-${String(index)}`,
          route: `/projects/item-${String(index)}/`,
        });
      }
    }));
  });

  it('rejects whitespace and control characters in canonical routes', () => {
    expectInvalid(mutatePage((page) => {
      const related = recordAt(page.nodes, 4);
      const projects = recordAt([related.props], 0).relatedProjects;
      recordAt(projects, 0).route = '/projects/bad route/';
    }));
    expectInvalid(mutatePage((page) => {
      const related = recordAt(page.nodes, 4);
      const projects = recordAt([related.props], 0).relatedProjects;
      recordAt(projects, 0).route = '/projects/bad\u0007route/';
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

function expectUnsupported(
  inputs: Parameters<typeof lowerProfunctorPageArtifacts>[0],
): void {
  expect(() => lowerProfunctorPageArtifacts(inputs)).toThrow(
    expect.objectContaining<Partial<ProfunctorPageTargetError>>({
      code: 'BIJOU_PAGE_BLOCK_UNSUPPORTED',
    }),
  );
}
