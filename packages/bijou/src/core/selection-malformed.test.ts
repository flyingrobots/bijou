import { describe, expect, it } from 'vitest';
import { defineSelectionOwner } from './selection.js';

describe('selection malformed content', () => {
  it('rejects unsupported content kinds with a deterministic domain error', () => {
    expect(() => {
      Reflect.apply(defineSelectionOwner, undefined, [{
        id: 'bad-kind',
        layoutNodeId: 'bad-kind.node',
        rect: { x: 0, y: 0, width: 1, height: 1 },
        content: { kind: 'chart' },
      }]);
    }).toThrow('bad selection kind chart');
  });
});
