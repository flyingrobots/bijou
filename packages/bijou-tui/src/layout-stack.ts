/** Vertical stack — join rendered blocks with newlines. */
export function vstack(...blocks: string[]): string {
  return blocks.join('\n');
}

/** Horizontal stack — place rendered blocks side by side. */
export function hstack(gap: number, ...blocks: string[]): string {
  if (blocks.length === 0) return '';
  if (blocks.length === 1) return blocks[0] ?? '';

  const split = blocks.map((block) => block.split('\n'));
  const maxRows = Math.max(...split.map((lines) => lines.length));
  const widths = split.map((lines) => Math.max(...lines.map(visualWidth)));
  const spacer = ' '.repeat(Math.max(0, gap));

  const rows: string[] = [];
  for (let row = 0; row < maxRows; row++) {
    const parts: string[] = [];
    for (let column = 0; column < split.length; column++) {
      const lines = split[column];
      const line = lines?.[row] ?? '';
      if (column < split.length - 1) {
        const width = widths[column] ?? 0;
        parts.push(
          line + ' '.repeat(Math.max(0, width - visualWidth(line))),
        );
      } else {
        parts.push(line);
      }
    }
    rows.push(parts.join(spacer).trimEnd());
  }
  return rows.join('\n');
}

function visualWidth(value: string): number {
  // eslint-disable-next-line no-control-regex
  return value.replace(/\x1b\[[0-9;]*m/g, '').length;
}
