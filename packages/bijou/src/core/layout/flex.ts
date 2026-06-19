import type { LayoutNode, LayoutRect } from '../../ports/surface.js';

/**
 * Options for the flex layout engine.
 */
export interface FlexOptions {
  direction?: 'row' | 'column';
  gap?: number;
}

/**
 * Metadata for a flex child.
 */
export interface FlexChildProps {
  id?: string;
  flex?: number;
  basis?: number;
  minSize?: number;
  maxSize?: number;
}

/**
 * Calculate flex layout geometry.
 * 
 * @param options - Flex container options.
 * @param children - Properties for each child.
 * @param bounds - Available space.
 * @returns Root LayoutNode containing child rects.
 */
export function calculateFlex(
  options: FlexOptions,
  children: FlexChildProps[],
  bounds: LayoutRect,
): LayoutNode {
  const direction = options.direction ?? 'row';
  const gap = options.gap ?? 0;
  const isRow = direction === 'row';

  const mainAxisTotal = isRow ? bounds.width : bounds.height;
  const crossAxisTotal = isRow ? bounds.height : bounds.width;

  if (children.length === 0) {
    return { rect: bounds, children: [] };
  }

  const totalGaps = gap * (children.length - 1);
  const available = Math.max(0, mainAxisTotal - totalGaps);

  // First pass: fixed sizes
  const sizes: number[] = [];
  let usedByFixed = 0;
  let totalFlex = 0;

  for (const child of children) {
    const flexGrow = child.flex ?? 0;
    if (flexGrow > 0) {
      sizes.push(0);
      totalFlex += flexGrow;
    } else {
      const b = child.basis ?? 0;
      const clamped = clamp(b, child.minSize, child.maxSize);
      sizes.push(clamped);
      usedByFixed += clamped;
    }
  }

  // Second pass: distribute remaining space to flex children iteratively
  // to correctly handle min/max constraints.
  let remaining = Math.max(0, available - usedByFixed);
  let activeFlex = totalFlex;
  const isConstrained = new Array(children.length).fill(false);

  // Iteratively distribute until all flex space is assigned or all flex children are constrained
  while (activeFlex > 0 && remaining > 0) {
    let spaceDistributed = false;
    const perFlexUnit = remaining / activeFlex;

    for (const [i, child] of children.entries()) {
      if (isConstrained[i]) continue;
      const flexGrow = child.flex ?? 0;
      if (flexGrow <= 0) continue;

      const currentSize = sizes[i] ?? 0;
      const targetSize = currentSize + (flexGrow * perFlexUnit);
      const clamped = clamp(targetSize, child.minSize, child.maxSize);

      if (clamped !== targetSize) {
        // This child hit a constraint
        sizes[i] = clamped;
        remaining -= (clamped - currentSize);
        activeFlex -= flexGrow;
        isConstrained[i] = true;
        spaceDistributed = true;
      }
    }

    if (!spaceDistributed) {
      // Final pass: distribute the last remaining bits without constraints (they are already satisfied)
      const fractionalShares: { index: number; remainder: number }[] = [];
      let assigned = 0;
      for (const [i, child] of children.entries()) {
        if (!isConstrained[i] && (child.flex ?? 0) > 0) {
          const flexGrow = child.flex ?? 0;
          const share = (flexGrow / activeFlex) * remaining;
          const whole = Math.floor(share);
          sizes[i] = (sizes[i] ?? 0) + whole;
          assigned += whole;
          fractionalShares.push({ index: i, remainder: share - whole });
        }
      }

      const leftover = Math.max(0, Math.ceil(remaining - assigned));
      fractionalShares.sort((a, b) => b.remainder - a.remainder || a.index - b.index);
      for (const { index } of fractionalShares.slice(0, leftover)) {
        sizes[index] = (sizes[index] ?? 0) + 1;
      }

      remaining = 0; // All done
    }
  }

  // Third pass: position calculation
  const childNodes: LayoutNode[] = [];
  let offset = 0;

  for (const [i, child] of children.entries()) {
    const size = sizes[i] ?? 0;
    
    const childRect: LayoutRect = isRow 
      ? {
          x: bounds.x + offset,
          y: bounds.y,
          width: size,
          height: crossAxisTotal,
        }
      : {
          x: bounds.x,
          y: bounds.y + offset,
          width: crossAxisTotal,
          height: size,
        };

    childNodes.push({
      id: child.id,
      rect: childRect,
      children: [],
    });

    offset += size + gap;
  }

  return {
    rect: bounds,
    children: childNodes,
  };
}

function clamp(val: number, min?: number, max?: number): number {
  let res = val;
  if (min !== undefined) res = Math.max(res, min);
  if (max !== undefined) res = Math.min(res, max);
  return Math.max(0, res);
}
