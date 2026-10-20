import { describe, expect, it } from 'vitest';
import {
  coordinateSelection,
  defineSelectionOwner,
} from '../../../packages/bijou/src/index.js';
import { readRepoFile } from '../repo.js';

describe('DX-030 boundary-aware pointer selection and copy', () => {
  it('ships a pure selection coordinator that uses retained geometry and semantic extraction', () => {
    const docsPane = defineSelectionOwner({
      id: 'docs-pane',
      layoutNodeId: 'layout.docs-pane',
      rect: { x: 20, y: 4, width: 18, height: 4 },
      viewport: { scrollY: 1 },
      content: {
        kind: 'prose',
        paragraphs: [
          'Header outside scroll',
          'Selectable docs prose',
          'Second selected row',
          'Footer outside drag',
        ],
      },
    });
    const shellChrome = defineSelectionOwner({
      id: 'shell-chrome',
      layoutNodeId: 'layout.shell',
      rect: { x: 0, y: 0, width: 80, height: 24 },
      zIndex: -1,
      content: { kind: 'surface', lines: ['chrome should not copy'] },
    });

    const result = coordinateSelection({
      owners: [shellChrome, docsPane],
      anchor: { x: 20, y: 4 },
      focus: { x: 200, y: 5 },
      dragSource: 'mouse',
    });

    expect(result.status).toBe('selected');
    if (result.status !== 'selected') {
      throw new Error('expected selected result');
    }
    expect(result.owner.id).toBe('docs-pane');
    expect(result.range.start).toEqual({ x: 0, y: 1 });
    expect(result.range.end).toEqual({ x: 17, y: 2 });
    expect(result.text).toBe('Selectable docs pr\nSecond selected ro');
    expect(result.text).not.toContain('chrome');
    expect(result.effect.kind).toBe('clipboard.write');
  });

  it('keeps compressed v6 lineage pointing to issue 186 evidence', () => {
    const design = readRepoFile('docs/design/DX-030-add-boundary-aware-pointer-selection-and-copy.md');
    const changelog = readRepoFile('docs/CHANGELOG.md');
    const backlog = readRepoFile('docs/method/backlog/v6.0.0/README.md');

    expect(design).toContain('DX-030 is landed for the `v6.0.0` release boundary.');
    expect(design).toContain('pure selection coordinator');
    expect(changelog).toContain('DX-030 boundary-aware selection and copy');
    expect(design).toContain('issue #186 closes through implementation');
    expect(backlog).toContain('## Landed Selection And Copy Anchor');
    expect(backlog).toContain('issue #186');
  });
});
