/**
 * Vertical stack — join blocks with newlines.
 */
export function vstack(...blocks: string[]): string {
  return blocks.join('\n');
}

/**
 * Horizontal stack — place blocks side by side with a gap between columns.
 * Pads shorter blocks with empty lines to align rows.
 */
export function hstack(gap: number, ...blocks: string[]): string {
  if (blocks.length === 0) return '';
  if (blocks.length === 1) return blocks[0]!;

  const split = blocks.map((b) => b.split('\n'));
  const maxRows = Math.max(...split.map((lines) => lines.length));
  const widths = split.map((lines) => Math.max(...lines.map(visualWidth)));
  const spacer = ' '.repeat(Math.max(0, gap));

  const rows: string[] = [];
  for (let r = 0; r < maxRows; r++) {
    const parts: string[] = [];
    for (let c = 0; c < split.length; c++) {
      const line = split[c]![r] ?? '';
      // Last column doesn't need right-padding
      if (c < split.length - 1) {
        parts.push(line + ' '.repeat(Math.max(0, widths[c]! - visualWidth(line))));
      } else {
        parts.push(line);
      }
    }
    rows.push(parts.join(spacer).trimEnd());
  }
  return rows.join('\n');
}

/** Width of a string with ANSI escapes stripped. */
function visualWidth(s: string): number {
  // Strip ANSI escape sequences
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}
