import { boxSurface, column, line, separator, separatorSurface, spacer } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function dividerPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly sections: readonly {
    readonly label?: string;
    readonly lines: readonly string[];
  }[];
}): string | Surface {
  const {
    width,
    ctx,
    title,
    sections,
  } = input;

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    const separatorWidth = Math.max(24, Math.min(width, 58));
    const lines = [title, ''];

    sections.forEach((section, index) => {
      if (index > 0) {
        lines.push(separator({ label: section.label, width: separatorWidth, ctx }));
      }
      lines.push(...section.lines);
      if (index < sections.length - 1) {
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  const panelWidth = Math.max(46, Math.min(width, 62));
  const innerWidth = Math.max(24, panelWidth - 2);
  const nodes: Surface[] = [];

  sections.forEach((section, index) => {
    if (index > 0) {
      nodes.push(separatorSurface({ label: section.label, width: innerWidth, ctx }));
      nodes.push(spacer());
    }
    section.lines.forEach((entry) => {
      nodes.push(line(entry, innerWidth));
    });
    if (index < sections.length - 1) {
      nodes.push(spacer());
    }
  });

  return boxSurface(column(nodes), {
    title,
    width: panelWidth,
    ctx,
  });
}
