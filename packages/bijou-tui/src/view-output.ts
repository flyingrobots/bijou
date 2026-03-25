import {
  createSurface,
  type LayoutNode,
  type Surface,
} from '@flyingrobots/bijou';
import { localizeLayout, localizeLayoutNode, paintLayoutNodeWithOffset } from './layout-node-surface.js';

export type ViewOutput = Surface | LayoutNode;

export interface ViewportSize {
  width: number;
  height: number;
}

export interface NormalizedViewOutput {
  kind: 'surface' | 'layout';
  surface: Surface;
}

export function isSurfaceView(value: unknown): value is Surface {
  return typeof value === 'object' && value !== null && 'cells' in value;
}

export function isLayoutNodeView(value: unknown): value is LayoutNode {
  return typeof value === 'object' && value !== null && 'rect' in value && 'children' in value;
}

export function normalizeViewOutput(
  output: ViewOutput,
  size: ViewportSize,
): NormalizedViewOutput {
  return normalizeViewOutputInto(output, size);
}

export function normalizeViewOutputInto(
  output: ViewOutput,
  size: ViewportSize,
  scratch?: Surface,
): NormalizedViewOutput {
  if (isSurfaceView(output)) {
    if (scratch == null) {
      return {
        kind: 'surface',
        surface: output,
      };
    }
    const surface = prepareNormalizedSurface(
      Math.max(size.width, output.width, 0),
      Math.max(size.height, output.height, 0),
      scratch,
    );
    surface.blit(output, 0, 0);
    return {
      kind: 'surface',
      surface,
    };
  }

  if (!isLayoutNodeView(output)) {
    throw new Error(
      'Bijou runtime views must return a Surface or LayoutNode. Raw strings are no longer supported; convert them explicitly with parseAnsiToSurface(...) or stringToSurface(...).',
    );
  }

  const localization = localizeLayout(output);
  const width = Math.max(size.width, localization.width, 0);
  const height = Math.max(size.height, localization.height, 0);
  const surface = prepareNormalizedSurface(width, height, scratch);
  paintLayoutNodeWithOffset(surface, output, localization.dx, localization.dy);
  return {
    kind: 'layout',
    surface,
  };
}

export function wrapViewOutputAsLayoutRoot(
  output: ViewOutput,
  _size: ViewportSize,
): LayoutNode {
  if (isSurfaceView(output)) {
    return {
      type: 'SurfaceView',
      rect: { x: 0, y: 0, width: output.width, height: output.height },
      children: [],
      surface: output,
    };
  }

  if (!isLayoutNodeView(output)) {
    throw new Error(
      'Bijou runtime views must return a Surface or LayoutNode. Raw strings are no longer supported; convert them explicitly with parseAnsiToSurface(...) or stringToSurface(...).',
    );
  }

  return localizeLayoutNode(output).node;
}

function prepareNormalizedSurface(width: number, height: number, scratch?: Surface): Surface {
  if (scratch != null && scratch.width === width && scratch.height === height) {
    scratch.clear();
    return scratch;
  }
  return createSurface(width, height);
}
