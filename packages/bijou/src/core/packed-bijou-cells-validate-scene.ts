import {
  PACKED_BIJOU_SCENE_VERSION,
  type PackedBijouCellsScene,
} from './packed-bijou-cells-contract.js';
import {
  arrayAt,
  canonicalIdAt,
  failPackedCells,
  literalAt,
  recordAt,
} from './packed-bijou-cells-schema.js';

const SCENE_FIELDS = [
  'sceneVersion',
  'sceneHash',
  'nodeIds',
  'cellNodeIds',
] as const;

export function validatePackedBijouScene(
  input: unknown,
  cellCount: number,
): PackedBijouCellsScene {
  const record = recordAt(input, '$.scene', SCENE_FIELDS);
  literalAt(
    record['sceneVersion'],
    PACKED_BIJOU_SCENE_VERSION,
    '$.scene.sceneVersion',
  );
  if (
    typeof record['sceneHash'] !== 'string' ||
    !/^[0-9a-f]{64}$/u.test(record['sceneHash'])
  ) {
    failPackedCells(
      'invalid-scene',
      '$.scene.sceneHash',
      'expected a lowercase SHA-256 digest',
    );
  }
  const nodeIds = uniqueSceneIds(record['nodeIds']);
  if (nodeIds.length === 0) {
    failPackedCells('invalid-scene', '$.scene.nodeIds', 'cannot be empty');
  }
  const known = new Set(nodeIds);
  const cellNodeIds = arrayAt(
    record['cellNodeIds'],
    '$.scene.cellNodeIds',
    cellCount,
  );
  if (cellNodeIds.length !== cellCount) {
    failPackedCells(
      'invalid-scene',
      '$.scene.cellNodeIds',
      `expected ${String(cellCount)} cell owners`,
    );
  }
  const owners = cellNodeIds.map((value, index) => {
    const path = `$.scene.cellNodeIds[${String(index)}]`;
    const id = canonicalIdAt(value, path);
    if (!known.has(id)) {
      failPackedCells('invalid-scene', path, 'owner is not a declared node');
    }
    return id;
  });
  return {
    sceneVersion: PACKED_BIJOU_SCENE_VERSION,
    sceneHash: record['sceneHash'],
    nodeIds,
    cellNodeIds: owners,
  };
}

function uniqueSceneIds(input: unknown): string[] {
  const path = '$.scene.nodeIds';
  const values = arrayAt(input, path);
  const seen = new Set<string>();
  return values.map((value, index) => {
    const itemPath = `${path}[${String(index)}]`;
    const id = canonicalIdAt(value, itemPath);
    if (seen.has(id)) {
      failPackedCells('invalid-scene', itemPath, 'duplicate id');
    }
    seen.add(id);
    return id;
  });
}
