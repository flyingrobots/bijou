/**
 * Flexbox-style layout for terminal UIs.
 *
 * Distributes available space among children using flex-grow factors,
 * fixed basis sizes, and min/max constraints. Children can be static
 * strings or render functions that receive their allocated dimensions.
 *
 * ```ts
 * flex({ direction: 'row', width: 80, height: 24 },
 *   { basis: 20, content: sidebar },
 *   { flex: 1, content: (w, h) => viewport({ width: w, height: h, content: body }) },
 * )
 * ```
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FlexOptions {
  /** Layout direction. Default: 'row'. */
  readonly direction?: 'row' | 'column';
  /** Available width in columns. */
  readonly width: number;
  /** Available height in rows. */
  readonly height: number;
  /** Gap between children (in the main axis). Default: 0. */
  readonly gap?: number;
}

export interface FlexChild {
  /**
   * Content to render. Either a static string, or a function that
   * receives the allocated (width, height) and returns a string.
   */
  readonly content: string | ((width: number, height: number) => string);
  /** Flex-grow factor. Children with flex > 0 share remaining space. Default: 0. */
  readonly flex?: number;
  /** Fixed size along the main axis (columns for row, rows for column). */
  readonly basis?: number;
  /** Minimum size along the main axis. */
  readonly minSize?: number;
  /** Maximum size along the main axis. */
  readonly maxSize?: number;
  /** Cross-axis alignment. Default: 'start'. */
  readonly align?: 'start' | 'center' | 'end';
}

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const ANSI_RE = /\x1b\[[0-9;]*m/g;

function visualWidth(s: string): number {
  return s.replace(ANSI_RE, '').length;
}

// ---------------------------------------------------------------------------
// Size computation
// ---------------------------------------------------------------------------

interface ResolvedChild {
  allocatedSize: number;
  crossSize: number;
  child: FlexChild;
}

function computeSizes(
  children: FlexChild[],
  mainAxisTotal: number,
  crossAxisTotal: number,
  gap: number,
  isRow: boolean,
): ResolvedChild[] {
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

  for (let i = 0; i < children.length; i++) {
    const flexGrow = children[i]!.flex ?? 0;
    if (flexGrow > 0) {
      const raw = totalFlex > 0 ? Math.floor((flexGrow / totalFlex) * remaining) : 0;
      sizes[i] = clampSize(raw, children[i]!.minSize, children[i]!.maxSize);
    }
  }

  return children.map((child, i) => ({
    allocatedSize: sizes[i]!,
    crossSize: crossAxisTotal,
    child,
  }));
}

function clampSize(size: number, min?: number, max?: number): number {
  let result = size;
  if (min !== undefined) result = Math.max(result, min);
  if (max !== undefined) result = Math.min(result, max);
  return Math.max(0, result);
}

function measureContent(
  content: string | ((width: number, height: number) => string),
  isRow: boolean,
): number {
  if (typeof content === 'function') {
    // Can't measure a render function — treat as 0 (must use flex or basis)
    return 0;
  }
  const lines = content.split('\n');
  if (isRow) {
    // Width = max visible line width
    return Math.max(0, ...lines.map(visualWidth));
  }
  // Height = number of lines
  return lines.length;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

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

/**
 * Clip/pad each content line to exact width. Does NOT pad height —
 * that's handled by alignCross.
 */
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

function clipToWidth(str: string, maxWidth: number): string {
  let visible = 0;
  let result = '';
  let inEscape = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]!;

    if (ch === '\x1b') {
      inEscape = true;
      result += ch;
      continue;
    }

    if (inEscape) {
      result += ch;
      if (ch === 'm') inEscape = false;
      continue;
    }

    if (visible >= maxWidth) {
      result += '\x1b[0m';
      break;
    }

    result += ch;
    visible++;
  }

  return result;
}

/**
 * Align content lines along the cross axis.
 */
function alignCross(
  lines: string[],
  totalCrossSize: number,
  align: 'start' | 'center' | 'end',
  width: number,
): string[] {
  if (lines.length >= totalCrossSize) return lines.slice(0, totalCrossSize);

  const emptyLine = ' '.repeat(Math.max(0, width));
  const padding = totalCrossSize - lines.length;

  switch (align) {
    case 'start':
      return [...lines, ...Array.from<string>({ length: padding }).fill(emptyLine)];
    case 'end':
      return [...Array.from<string>({ length: padding }).fill(emptyLine), ...lines];
    case 'center': {
      const before = Math.floor(padding / 2);
      const after = padding - before;
      return [
        ...Array.from<string>({ length: before }).fill(emptyLine),
        ...lines,
        ...Array.from<string>({ length: after }).fill(emptyLine),
      ];
    }
  }
}

// ---------------------------------------------------------------------------
// flex() — main API
// ---------------------------------------------------------------------------

/**
 * Lay out children using flexbox-style rules.
 *
 * Row direction: children are placed side-by-side horizontally.
 * Column direction: children are stacked vertically.
 *
 * ```ts
 * // Sidebar + main content
 * flex({ direction: 'row', width: 80, height: 24, gap: 1 },
 *   { basis: 20, content: sidebarContent },
 *   { flex: 1, content: (w, h) => renderMain(w, h) },
 * )
 *
 * // Header + body + footer
 * flex({ direction: 'column', width: 80, height: 24 },
 *   { basis: 1, content: headerLine },
 *   { flex: 1, content: (w, h) => renderBody(w, h) },
 *   { basis: 1, content: statusLine },
 * )
 * ```
 */
export function flex(options: FlexOptions, ...children: FlexChild[]): string {
  const { direction = 'row', width, height, gap = 0 } = options;
  const isRow = direction === 'row';

  const mainAxisTotal = isRow ? width : height;
  const crossAxisTotal = isRow ? height : width;

  if (children.length === 0) return '';

  const resolved = computeSizes(children, mainAxisTotal, crossAxisTotal, gap, isRow);

  if (isRow) {
    return renderRow(resolved, width, height, gap);
  }
  return renderColumn(resolved, width, height, gap);
}

function renderRow(
  items: ResolvedChild[],
  _totalWidth: number,
  totalHeight: number,
  gap: number,
): string {
  // Render each child into a column of lines
  const columns: string[][] = [];

  for (const item of items) {
    const childWidth = item.allocatedSize;
    const rendered = renderContent(item.child, childWidth, totalHeight);
    const widthFitted = fitWidth(rendered, childWidth, item.child.align ?? 'start');
    const aligned = alignCross(widthFitted, totalHeight, item.child.align ?? 'start', childWidth);
    columns.push(aligned);
  }

  // Compose columns side-by-side
  const spacer = ' '.repeat(Math.max(0, gap));
  const rows: string[] = [];
  for (let r = 0; r < totalHeight; r++) {
    const parts: string[] = [];
    for (let c = 0; c < columns.length; c++) {
      parts.push(columns[c]![r]!);
    }
    rows.push(parts.join(spacer));
  }
  return rows.join('\n');
}

function renderColumn(
  items: ResolvedChild[],
  totalWidth: number,
  totalHeight: number,
  gap: number,
): string {
  const lines: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const childHeight = item.allocatedSize;
    const rendered = renderContent(item.child, totalWidth, childHeight);
    const widthFitted = fitWidth(rendered, totalWidth, item.child.align ?? 'start');
    const aligned = alignCross(widthFitted, childHeight, 'start', totalWidth);
    
    lines.push(...aligned);

    // Add gap between items
    if (i < items.length - 1 && gap > 0) {
      const spacer = ' '.repeat(Math.max(0, totalWidth));
      for (let g = 0; g < gap; g++) {
        lines.push(spacer);
      }
    }
  }

  // Pad to fill totalHeight if needed
  const emptyLine = ' '.repeat(Math.max(0, totalWidth));
  while (lines.length < totalHeight) {
    lines.push(emptyLine);
  }

  return lines.slice(0, totalHeight).join('\n');
}
