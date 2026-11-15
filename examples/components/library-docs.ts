import { createSurface, wrapToWidth, type BijouContext, type Surface } from '../../packages/bijou/src/index.js';
import type { ComponentStory } from '../_stories/protocol.js';
import { designFamilyFor, type DesignField } from './library-design.js';
import { SNIPPETS } from './library-snippets.js';

const MAX_CODE_LINES = 8;
const MAX_POINTS = 4;
const MODES = ['interactive', 'static', 'pipe', 'accessible'] as const;

interface Line {
  readonly text: string;
  readonly kind: 'heading' | 'prose' | 'muted' | 'code' | 'blank';
}

/**
 * Wrap prose; `code` spans written with backticks keep their name but lose the ticks.
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
 * The info panel (`i`), using the design system's family fields in their order (book record R19):
 * Family, Variants, Use when, Avoid when, Content guidance, Ownership, Graceful lowering, and
 * Related families, then the on-screen variant's example. The component's own story supplies a
 * field where it has one; the family entry in the design-system docs fills the rest.
 */
export function docsSurface(
  story: ComponentStory, variantIndex: number, width: number, ctx: BijouContext, rtl = false,
): Surface {
  const family = designFamilyFor(story);
  const field = (name: DesignField): readonly string[] => family?.fields.get(name) ?? [];
  const pick = (own: readonly string[], name: DesignField): readonly string[] => (own.length > 0 ? own : field(name));
  const variants = story.variants.map((v, i) =>
    `${v.label}${i === variantIndex ? ' (on screen)' : ''}${v.description === undefined ? '' : `: ${v.description}`}`);
  const lowering = MODES.map((mode) => `${mode}: ${story.docs.gracefulLowering[mode]}`);
  const lines: Line[] = [
    ...(family === undefined ? [] : [{ text: `Family: ${family.name}`, kind: 'muted' } satisfies Line]),
    ...prose(story.docs.summary, width, rtl),
    ...section('Variants', variants, width, rtl),
    ...section('Use when', pick(story.docs.useWhen, 'Use when'), width, rtl),
    ...section('Avoid when', pick(story.docs.avoidWhen, 'Avoid when'), width, rtl),
    ...section('Content guidance', field('Content guidance'), width, rtl),
    ...section('Ownership', field('Ownership'), width, rtl),
    ...section('Graceful lowering', lowering, width, rtl),
    ...section('Related families', pick(story.docs.relatedFamilies, 'Related families'), width, rtl),
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
