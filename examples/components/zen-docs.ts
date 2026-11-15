import { createSurface, wrapToWidth, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';
import { SNIPPETS } from './zen-snippets.js';

const MAX_CODE_LINES = 8;
const MAX_POINTS = 3;

interface Line {
  readonly text: string;
  readonly kind: 'heading' | 'prose' | 'muted' | 'code' | 'blank';
}

/**
 * Wrap prose; `code` spans written with backticks in the story docs keep their name but lose the ticks.
 * A bullet sits at the start edge: left in LTR, right in RTL, with wrapped lines indented from that side.
 */
function prose(text: string, width: number, rtl: boolean, bullet = false): Line[] {
  const mark = bullet ? 2 : 0;
  return wrapToWidth(text.replace(/`([^`]+)`/g, '$1'), width - mark).map((line, i) => {
    const lead = !bullet ? '' : i === 0 ? '•' : ' ';
    return { text: !bullet ? line : rtl ? `${line} ${lead}` : `${lead} ${line}`, kind: 'prose' };
  });
}

function section(heading: string, points: readonly string[], width: number, rtl: boolean): Line[] {
  if (points.length === 0) return [];
  return [
    { text: '', kind: 'blank' },
    { text: heading, kind: 'heading' },
    ...points.slice(0, MAX_POINTS).flatMap((point) => prose(point, width, rtl, true)),
  ];
}

/**
 * The info panel (`i`): what the component is, when to choose the variant on screen,
 * when to use the component and when not to, and the variant's own render() call.
 * Prose aligns to the reading direction; code stays left to right.
 */
export function docsSurface(
  story: ComponentStory, variantIndex: number, width: number, ctx: BijouContext, rtl = false,
): Surface {
  const variant = story.variants[variantIndex];
  const lines: Line[] = [
    ...prose(story.docs.summary, width, rtl),
    ...(variant?.description === undefined ? [] : section(`This variant: ${variant.label}`, [variant.description], width, rtl)),
    ...section('When to use', story.docs.useWhen, width, rtl),
    ...section('When not to use', story.docs.avoidWhen, width, rtl),
  ];
  const all = SNIPPETS.get(story.id)?.[variantIndex] ?? [];
  const abridged = all.length > MAX_CODE_LINES;
  const code = (abridged ? all.slice(0, MAX_CODE_LINES - 1) : all).flatMap((line) => wrapToWidth(line, width - 4));
  if (code.length > 0) {
    lines.push(
      { text: '', kind: 'blank' },
      { text: 'Example', kind: 'heading' },
      { text: abridged ? `From the story's render() call, abridged after ${String(MAX_CODE_LINES - 1)} lines.` : "From the story's render() call.", kind: 'muted' },
      { text: '', kind: 'code' },
      ...code.map((text): Line => ({ text, kind: 'code' })),
      { text: '', kind: 'code' },
    );
  }

  const surface = createSurface(width, lines.length);
  const codeBg = ctx.surface('elevated').bg ?? ctx.surface('elevated').hex;
  lines.forEach((line, y) => {
    const glyphs = Array.from(line.text);
    if (line.kind === 'code') {
      for (let x = 0; x < width; x++) surface.set(x, y, { char: glyphs[x - 2] ?? ' ', bg: codeBg, empty: false });
      return;
    }
    const x0 = rtl ? Math.max(0, width - glyphs.length) : 0;
    const cell = line.kind === 'heading' ? { modifiers: ['bold'] } : line.kind === 'muted' ? { fg: ctx.semantic('muted').hex } : {};
    glyphs.forEach((char, i) => { if (x0 + i < width) surface.set(x0 + i, y, { char, ...cell, empty: false }); });
  });
  return surface;
}
