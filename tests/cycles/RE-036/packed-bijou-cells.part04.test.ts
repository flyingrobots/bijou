import { describe, it } from 'vitest';
import {
  arrayField,
  expectReceiptError,
  recordField,
  validPackedCellsInput,
} from './packed-bijou-cells.test-support.js';

describe('RE-036 packed-bijou-cells/1 metadata', () => {
  it('rejects invalid scene identity and per-cell ownership', () => {
    const hash = validPackedCellsInput();
    recordField(hash, 'scene').sceneHash = 'not-a-hash';
    expectReceiptError(hash, 'invalid-scene', '$.scene.sceneHash');

    const duplicate = validPackedCellsInput();
    const nodes = arrayField(recordField(duplicate, 'scene'), 'nodeIds');
    nodes[1] = nodes[0];
    expectReceiptError(duplicate, 'invalid-scene', '$.scene.nodeIds[1]');

    const short = validPackedCellsInput();
    arrayField(recordField(short, 'scene'), 'cellNodeIds').pop();
    expectReceiptError(short, 'invalid-scene', '$.scene.cellNodeIds');

    const unknown = validPackedCellsInput();
    arrayField(recordField(unknown, 'scene'), 'cellNodeIds')[0] =
      'scene.unknown';
    expectReceiptError(unknown, 'invalid-scene', '$.scene.cellNodeIds[0]');
  });

  it('rejects duplicate, unknown, and inconsistent focus identities', () => {
    const duplicate = validPackedCellsInput();
    const ids = arrayField(recordField(duplicate, 'focus'), 'focusableNodeIds');
    ids[1] = ids[0];
    expectReceiptError(
      duplicate,
      'invalid-focus',
      '$.focus.focusableNodeIds[1]',
    );

    const unknown = validPackedCellsInput();
    arrayField(recordField(unknown, 'focus'), 'focusableNodeIds')[0] =
      'scene.unknown';
    expectReceiptError(unknown, 'invalid-focus', '$.focus.focusableNodeIds[0]');

    const inconsistent = validPackedCellsInput();
    recordField(inconsistent, 'focus').focusedNodeId = 'scene.root';
    expectReceiptError(inconsistent, 'invalid-focus', '$.focus.focusedNodeId');
  });

  it('rejects unsupported chroma metadata without conversion', () => {
    const cases: readonly (readonly [string, string])[] = [
      ['colorSpace', 'display-p3'],
      ['channelEncoding', 'float32'],
      ['alphaEncoding', 'uint8'],
      ['terminalDefaultEncoding', 'rgb-zero'],
    ];
    for (const [field, value] of cases) {
      const input = validPackedCellsInput();
      recordField(input, 'chroma')[field] = value;
      expectReceiptError(input, 'invalid-chroma', `$.chroma.${field}`);
    }
  });
});
