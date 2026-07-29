import type {
  PackedBijouCellsChroma,
  PackedBijouCellsFocus,
} from './packed-bijou-cells-contract.js';
import {
  arrayAt,
  canonicalIdAt,
  failPackedCells,
  recordAt,
} from './packed-bijou-cells-schema.js';

const FOCUS_FIELDS = ['focusedNodeId', 'focusableNodeIds'] as const;
const CHROMA_FIELDS = [
  'colorSpace',
  'channelEncoding',
  'alphaEncoding',
  'terminalDefaultEncoding',
] as const;

export function validatePackedBijouFocus(
  input: unknown,
  nodeIds: ReadonlySet<string>,
): PackedBijouCellsFocus {
  const record = recordAt(input, '$.focus', FOCUS_FIELDS);
  const focusableNodeIds = uniqueFocusIds(record['focusableNodeIds']);
  for (const [index, id] of focusableNodeIds.entries()) {
    if (!nodeIds.has(id)) {
      failPackedCells(
        'invalid-focus',
        `$.focus.focusableNodeIds[${String(index)}]`,
        'focusable id is not a declared scene node',
      );
    }
  }
  const focusedNodeId =
    record['focusedNodeId'] === null
      ? null
      : canonicalIdAt(
          record['focusedNodeId'],
          '$.focus.focusedNodeId',
          'invalid-focus',
        );
  if (focusedNodeId !== null && !focusableNodeIds.includes(focusedNodeId)) {
    failPackedCells(
      'invalid-focus',
      '$.focus.focusedNodeId',
      'focused id is not in focusableNodeIds',
    );
  }
  return { focusedNodeId, focusableNodeIds };
}

export function validatePackedBijouChroma(
  input: unknown,
): PackedBijouCellsChroma {
  const record = recordAt(input, '$.chroma', CHROMA_FIELDS);
  const literals = {
    colorSpace: 'srgb',
    channelEncoding: 'uint8',
    alphaEncoding: 'uint6',
    terminalDefaultEncoding: 'presence-bits',
  } as const;
  for (const field of CHROMA_FIELDS) {
    if (record[field] !== literals[field]) {
      failPackedCells(
        'invalid-chroma',
        `$.chroma.${field}`,
        `expected "${literals[field]}"`,
      );
    }
  }
  return literals;
}

function uniqueFocusIds(input: unknown): string[] {
  const path = '$.focus.focusableNodeIds';
  const values = arrayAt(input, path);
  const seen = new Set<string>();
  return values.map((value, index) => {
    const itemPath = `${path}[${String(index)}]`;
    const id = canonicalIdAt(value, itemPath, 'invalid-focus');
    if (seen.has(id)) {
      failPackedCells('invalid-focus', itemPath, 'duplicate id');
    }
    seen.add(id);
    return id;
  });
}
