import { describe, expect, it } from 'vitest';
import { coordinateSelection, defineSelectionOwner, extractSelectionText, selectionRange } from './selection.js';

describe('boundary-aware selection and copy primitives', () => {
  it('skips ragged table rows that do not intersect the selected columns', () => {
      const owner = defineSelectionOwner({
        id: 'ragged-table',
        layoutNodeId: 'ragged-table.node',
        rect: { x: 0, y: 0, width: 4, height: 3 },
        content: {
          kind: 'table',
          rows: [
            ['Header'],
            [],
            ['c0', 'c1', 'c2', 'c3'],
          ],
        },
      });
      const range = selectionRange(owner, {
        anchor: { x: 2, y: 0 },
        focus: { x: 3, y: 2 },
      });

      expect(extractSelectionText(owner.content, range)).toBe('c2\tc3');
    });

  it('does not copy the last character when selecting blank columns after a short line', () => {
      const owner = defineSelectionOwner({
        id: 'short-line',
        layoutNodeId: 'short-line.node',
        rect: { x: 0, y: 0, width: 20, height: 1 },
        content: { kind: 'surface', lines: ['short'] },
      });
      const range = selectionRange(owner, {
        anchor: { x: 10, y: 0 },
        focus: { x: 18, y: 0 },
      });

      expect(extractSelectionText(owner.content, range)).toBe('');
    });

  it('does not copy the final content row when selecting blank rows below content', () => {
      const owner = defineSelectionOwner({
        id: 'short-content',
        layoutNodeId: 'short-content.node',
        rect: { x: 0, y: 0, width: 20, height: 4 },
        content: { kind: 'prose', paragraphs: ['only row'] },
      });
      const range = selectionRange(owner, {
        anchor: { x: 0, y: 2 },
        focus: { x: 7, y: 3 },
      });

      expect(extractSelectionText(owner.content, range)).toBe('');
    });

  it('extracts mixed content regions in semantic child order within one owner', () => {
      const owner = defineSelectionOwner({
        id: 'mixed',
        layoutNodeId: 'mixed.node',
        rect: { x: 0, y: 0, width: 20, height: 4 },
        content: {
          kind: 'mixed',
          regions: [
            {
              id: 'summary',
              rect: { x: 0, y: 0, width: 12, height: 1 },
              content: { kind: 'prose', paragraphs: ['Summary text'] },
            },
            {
              id: 'facts',
              rect: { x: 0, y: 1, width: 2, height: 2 },
              content: {
                kind: 'table',
                rows: [
                  ['Key', 'Value'],
                  ['Owner', 'Bijou'],
                ],
              },
            },
          ],
        },
      });

      const range = selectionRange(owner, {
        anchor: { x: 0, y: 0 },
        focus: { x: 1, y: 2 },
      });

      expect(extractSelectionText(owner.content, range)).toBe(
        'Summary text\nKey\tValue\nOwner\tBijou',
      );
    });

  it('falls back to terminal-native selection when no selectable owner contains the anchor', () => {
      const result = coordinateSelection({
        owners: [],
        anchor: { x: 1, y: 1 },
        focus: { x: 3, y: 1 },
      });

      expect(result).toEqual({
        status: 'fallback',
        reason: 'terminal-native',
      });
    });
});
