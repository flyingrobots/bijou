import type { Cell } from '../ports/surface.js';
import type {
  UiCellSourceMapEntry,
  UiSceneSurfaceLowering,
} from './ui-scene-lowering.js';

/** The facts the terminal output states for one drawn text node. */
export interface UiSceneParityTerminalNode {
  readonly entry: UiCellSourceMapEntry;
  /** The characters in the cells of the span, read from the Surface. */
  readonly text: string;
  readonly fgColor: string | undefined;
  readonly bgColor: string | undefined;
  readonly modifiers: string | undefined;
  /** Whether a node drawn later covers a cell of the span. */
  readonly overdrawn: boolean;
}

/** Each cell source map entry with its cells, by node id. */
export function terminalParityNodes(
  lowering: UiSceneSurfaceLowering,
): ReadonlyMap<string, UiSceneParityTerminalNode> {
  const nodes = new Map<string, UiSceneParityTerminalNode>();
  lowering.cellSourceMap.forEach((entry, index) => {
    const cells: Cell[] = [];
    for (let offset = 0; offset < entry.width; offset++) {
      cells.push(lowering.surface.get(entry.x + offset, entry.y));
    }
    nodes.set(entry.nodeId, {
      entry,
      text: cells.map((cell) => cell.char).join(''),
      fgColor: distinct(cells.map((cell) => colorText(cell.fg))),
      bgColor: distinct(cells.map((cell) => colorText(cell.bg))),
      modifiers: distinct(
        cells.map((cell) => (cell.modifiers ?? []).join(' ')),
      ),
      overdrawn: lowering.cellSourceMap
        .slice(index + 1)
        .some((later) => overlaps(entry, later)),
    });
  });
  return nodes;
}

function colorText(color: Cell['fg']): string {
  if (color == null) return '';
  return typeof color === 'string' ? color : color.hex;
}

/**
 * One value when every cell agrees, and the distinct values joined by `|`
 * when they do not. A span whose cells carry nothing gives `undefined`.
 */
function distinct(values: readonly string[]): string | undefined {
  const joined = [...new Set(values)].join('|');
  return joined === '' ? undefined : joined;
}

function overlaps(a: UiCellSourceMapEntry, b: UiCellSourceMapEntry): boolean {
  return a.y === b.y && a.x < b.x + b.width && b.x < a.x + a.width;
}
