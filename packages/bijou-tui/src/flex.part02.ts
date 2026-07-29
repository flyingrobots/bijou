import type { Surface } from '@flyingrobots/bijou';
import { clipToWidth } from './viewport.js';
import { clampSize, measureContent, visualWidth } from './flex.part01.js';
import type { FlexChild, FlexChildLike, ResolvedFlexChild, SurfaceFlexChild } from './flex.part01.js';

function computeSizes<T extends FlexChildLike>(
  children: readonly T[],
  mainAxisTotal: number,
  crossAxisTotal: number,
  gap: number,
  isRow: boolean,
): ResolvedFlexChild<T>[] {
  if (children.length === 0) return [];

  const totalGaps = gap * (children.length - 1);
  const available = Math.max(0, mainAxisTotal - totalGaps);

  // First pass: allocate fixed-size children (basis or content measurement)
  const sizes: number[] = [];
  let usedByFixed = 0;
  let totalFlex = 0;

  for (const child of children) {
    const flexGrow = child.flex ?? 0;
    if (flexGrow > 0) {
      sizes.push(0); // placeholder
      totalFlex += flexGrow;
    } else if (child.basis !== undefined) {
      const clamped = clampSize(child.basis, child.minSize, child.maxSize);
      sizes.push(clamped);
      usedByFixed += clamped;
    } else {
      // Auto-size from content
      const measured = measureContent(child.content, isRow);
      const clamped = clampSize(measured, child.minSize, child.maxSize);
      sizes.push(clamped);
      usedByFixed += clamped;
    }
  }

  // Second pass: distribute remaining space to flex children
  const remaining = Math.max(0, available - usedByFixed);

  for (const [i, child] of children.entries()) {
    const flexGrow = child.flex ?? 0;
    if (flexGrow > 0) {
      const raw = totalFlex > 0 ? Math.floor((flexGrow / totalFlex) * remaining) : 0;
      sizes[i] = clampSize(raw, child.minSize, child.maxSize);
    }
  }

  return children.map((child, i) => ({
    allocatedSize: sizes[i] ?? 0,
    crossSize: crossAxisTotal,
    child,
  }));
}

function renderContent(
  child: FlexChild,
  width: number,
  height: number,
): string {
  if (typeof child.content === 'function') {
    return child.content(width, height);
  }
  return child.content;
}

function renderSurfaceContent(
  child: SurfaceFlexChild,
  width: number,
  height: number,
): string | Surface {
  if (typeof child.content === 'function') {
    return child.content(width, height);
  }
  return child.content;
}

function fitWidth(content: string, width: number, align: 'start' | 'center' | 'end' = 'start'): string[] {
  const lines = content.split('\n');
  return lines.map((line) => {
    const vis = visualWidth(line);
    if (vis > width) {
      return clipToWidth(line, width);
    }

    const padding = Math.max(0, width - vis);
    switch (align) {
      case 'start':
        return line + ' '.repeat(padding);
      case 'end':
        return ' '.repeat(padding) + line;
      case 'center': {
        const before = Math.floor(padding / 2);
        const after = padding - before;
        return ' '.repeat(before) + line + ' '.repeat(after);
      }
    }
  });
}

export { computeSizes, fitWidth, renderContent, renderSurfaceContent };
