import type { TokenValue } from '../theme/tokens.js';
import type {
  DagEdgeStyle,
  DagNode,
  DagNodePosition,
  DagNodeStyle,
} from './dag.js';
import type { GridState } from './dag-edges.js';

export type DagCharType = 'border' | 'label' | 'badge' | 'pad';

export interface DagNodeBox {
  readonly lines: string[];
  readonly charTypes: DagCharType[][];
  readonly height: number;
  readonly width: number;
}

export interface PlacedDagNode {
  readonly startRow: number;
  readonly startCol: number;
  readonly width: number;
  readonly box: DagNodeBox;
  readonly chars: string[][];
  readonly charTypes: DagCharType[][];
  readonly borderToken: TokenValue;
  readonly padToken: TokenValue;
  readonly labelToken: TokenValue;
  readonly badgeToken: TokenValue;
  readonly node: DagNode;
}

export interface DagRenderLayout {
  readonly layerMap: Map<string, number>;
  readonly layers: string[][];
  readonly columnIndex: Map<string, number>;
  readonly nodeStyle: DagNodeStyle;
  readonly edgeStyle: DagEdgeStyle;
  readonly nodeHeight: number;
  readonly rowStride: number;
  readonly nodeWidth: number;
  readonly layerOffsets: number[];
  readonly columnStride: number;
  readonly gridRows: number;
  readonly gridColumns: number;
  readonly columnCenter: (layer: number, column: number) => number;
  readonly grid: GridState;
  readonly positions: Map<string, DagNodePosition>;
  readonly nodesByRow: Map<number, PlacedDagNode[]>;
}
