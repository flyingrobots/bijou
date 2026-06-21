import { describe, expect, it } from 'vitest';
import { coordinateSelection, defineSelectionOwner, extractSelectionText, selectionRange } from './selection.js';

describe('boundary-aware selection and copy primitives', () => {
  it('keeps drag selection bounded to the owner rectangle and extracts semantic prose', () => {
      const owner = defineSelectionOwner({
        id: 'reader',
        layoutNodeId: 'docs.reader',
        rect: { x: 10, y: 5, width: 12, height: 3 },
        content: {
          kind: 'prose',
          paragraphs: [
            'Reader content line',
            'Second selected line',
            'Outside viewport line',
          ],
        },
      });

      const result = coordinateSelection({
        owners: [owner],
        anchor: { x: 12, y: 5 },
        focus: { x: 80, y: 6 },
        dragSource: 'mouse',
      });

      expect(result.status).toBe('selected');
      if (result.status !== 'selected') {
        throw new Error('expected selected result');
      }
      expect(result.range).toMatchObject({
        ownerId: 'reader',
        anchor: { x: 2, y: 0 },
        focus: { x: 11, y: 1 },
        start: { x: 2, y: 0 },
        end: { x: 11, y: 1 },
        dragSource: 'mouse',
      });
      expect(result.text).toBe('ader conte\nSecond selec');
      expect(result.effect).toEqual({
        kind: 'clipboard.write',
        ownerId: 'reader',
        text: 'ader conte\nSecond selec',
        facts: [
          { kind: 'entity', key: 'selection.owner', value: 'reader' },
          { kind: 'state', key: 'clipboard.effect', value: 'pending' },
        ],
      });
    });

  it('uses topmost retained geometry and lets higher-priority blockers win', () => {
      const base = defineSelectionOwner({
        id: 'base',
        layoutNodeId: 'base.node',
        rect: { x: 0, y: 0, width: 12, height: 2 },
        zIndex: 0,
        content: { kind: 'surface', lines: ['base text'] },
      });
      const overlay = defineSelectionOwner({
        id: 'overlay',
        layoutNodeId: 'overlay.node',
        rect: { x: 4, y: 0, width: 12, height: 2 },
        zIndex: 10,
        content: { kind: 'surface', lines: ['overlay text'] },
      });

      const selected = coordinateSelection({
        owners: [base, overlay],
        anchor: { x: 5, y: 0 },
        focus: { x: 8, y: 0 },
      });
      const blocked = coordinateSelection({
        owners: [base, overlay],
        blockers: [{
          id: 'resize-handle',
          reason: 'drag-handle',
          rect: { x: 5, y: 0, width: 1, height: 2 },
        }],
        anchor: { x: 5, y: 0 },
        focus: { x: 8, y: 0 },
      });

      expect(selected.status).toBe('selected');
      if (selected.status !== 'selected') {
        throw new Error('expected selected result');
      }
      expect(selected.owner.id).toBe('overlay');
      expect(selected.text).toBe('verl');
      expect(blocked).toEqual({
        status: 'blocked',
        reason: 'drag-handle',
        blockerId: 'resize-handle',
      });
    });

  it('extracts table selections as tab-delimited semantic cells instead of raw rows', () => {
      const owner = defineSelectionOwner({
        id: 'table',
        layoutNodeId: 'table.node',
        rect: { x: 0, y: 0, width: 3, height: 3 },
        content: {
          kind: 'table',
          rows: [
            ['Name', 'Status', 'Owner'],
            ['DX-030', 'ready', 'Bijou'],
            ['DX-034', 'landed', 'Bijou'],
          ],
        },
      });
      const range = selectionRange(owner, {
        anchor: { x: 0, y: 0 },
        focus: { x: 1, y: 2 },
      });

      expect(extractSelectionText(owner.content, range)).toBe(
        'Name\tStatus\nDX-030\tready\nDX-034\tlanded',
      );
    });

  it('normalizes diagonal table drags into rectangular semantic cell ranges', () => {
      const owner = defineSelectionOwner({
        id: 'table',
        layoutNodeId: 'table.node',
        rect: { x: 0, y: 0, width: 3, height: 3 },
        content: {
          kind: 'table',
          rows: [
            ['Name', 'Status', 'Owner'],
            ['DX-030', 'ready', 'Bijou'],
            ['DX-034', 'landed', 'Bijou'],
          ],
        },
      });
      const range = selectionRange(owner, {
        anchor: { x: 2, y: 0 },
        focus: { x: 1, y: 2 },
      });

      expect(extractSelectionText(owner.content, range)).toBe(
        'Status\tOwner\nready\tBijou\nlanded\tBijou',
      );
    });
});
