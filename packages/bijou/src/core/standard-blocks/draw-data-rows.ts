import { createSurface, type Surface } from '../../ports/surface.js';
import type { RenderSection } from './render.part01.js';
import { isSurfaceSlotValue } from './render.part02.js';
import { ownSlotValue, slotValueText } from './render.part03.js';
import { contentRows, prefixedRows, type SlotContent } from './draw-data-wrap.js';

/** The gutter glyph that marks the selected entry of a drawn data block. */
const SELECTED_MARK = '▸';

/** Rows stacked top to bottom on a Surface exactly `width` columns wide. Callers wrap or clip each row first. */
function stackRows(rows: readonly Surface[], width: number): Surface {
  const height = Math.max(1, rows.reduce((sum, row) => sum + row.height, 0));
  const stacked = createSurface(width, height);
  let y = 0;
  for (const row of rows) {
    stacked.blit(row, 0, y);
    y += row.height;
  }
  return stacked;
}

/** Surfaces placed side by side, top-aligned, `gap` blank columns apart. */
function joinRow(parts: readonly Surface[], gap = 1): Surface {
  const width = parts.reduce((sum, part) => sum + part.width, 0) + (gap * Math.max(0, parts.length - 1));
  const joined = createSurface(Math.max(1, width), Math.max(1, ...parts.map((part) => part.height)));
  let x = 0;
  for (const part of parts) {
    joined.blit(part, x, 0);
    x += part.width + gap;
  }
  return joined;
}

/** The section with `id`, when the block's slot is present. */
function presentSection(sections: readonly RenderSection[], id: string): RenderSection | undefined {
  return sections.find((section) => section.id === id && section.present);
}

/** What section `id` shows: its text or nested Surface, or its missing-slot text when required and absent. */
function sectionVisual(sections: readonly RenderSection[], id: string): SlotContent {
  return sections.find((section) => section.id === id)?.visualContent ?? '';
}

/** The text of present section `id`, for matching a selection; undefined when absent. */
function presentText(sections: readonly RenderSection[], id: string): string | undefined {
  return presentSection(sections, id)?.content;
}

/**
 * The entries of list slot `id`, read through `ownSlotValue`: text, or a nested
 * Surface kept as it is. A non-list value, or the missing-slot text, is one entry.
 */
function listEntries(
  slots: Readonly<Record<string, unknown>> | undefined,
  sections: readonly RenderSection[],
  id: string,
): readonly SlotContent[] {
  const value: unknown = ownSlotValue(slots, id);
  if (Array.isArray(value)) {
    const items: readonly unknown[] = value;
    const entries = items.flatMap((item): SlotContent[] => {
      if (isSurfaceSlotValue(item)) return [item];
      const text = slotValueText(item);
      return text === undefined || text.trim() === '' ? [] : [text];
    });
    if (entries.length > 0) return entries;
  }
  const visual = sectionVisual(sections, id);
  return visual === '' ? [] : [visual];
}

/**
 * The index of the text entry that `selected` names: an exact match first,
 * then the one entry that starts or ends with `selected` as a whole word. -1
 * when none does, or when that loose match is not unique.
 */
function selectedIndex(entries: readonly SlotContent[], selected: string | undefined): number {
  if (selected === undefined || selected.trim() === '') return -1;
  const exact = entries.indexOf(selected);
  if (exact !== -1) return exact;
  const loose = entries.flatMap((entry, index) => (typeof entry === 'string'
    && (entry.startsWith(`${selected} `) || entry.endsWith(` ${selected}`)) ? [index] : []));
  return loose.length === 1 ? (loose[0] ?? -1) : -1;
}

/** The text of the present `selected` slot, for matching; undefined when it is absent or holds a Surface. */
function selectedText(sections: readonly RenderSection[]): string | undefined {
  const section = presentSection(sections, 'selected');
  return section === undefined || typeof section.visualContent !== 'string' ? undefined : section.content;
}

/**
 * The `selected` slot as its own row when it marks no entry: `Label: value`
 * (a Surface value blitted beside the label), or the missing-slot text when
 * the required slot is absent. Nothing when an entry is marked.
 */
function unmatchedSelectionRows(sections: readonly RenderSection[], marked: number, width: number): readonly Surface[] {
  const section = sections.find((candidate) => candidate.id === 'selected');
  if (section === undefined || marked !== -1) return [];
  if (!section.present) return contentRows(section.content, width);
  return prefixedRows(`${section.label}: `, section.visualContent, width);
}

/**
 * `Label: value` for each present section in `ids`, wrapped to `width`. Text
 * values share rows, joined with ` · `; a Surface value gets its own row.
 */
function factsRows(sections: readonly RenderSection[], ids: readonly string[], width: number): readonly Surface[] {
  const present = ids.flatMap((id) => presentSection(sections, id) ?? []);
  const texts = present.flatMap((section) => (typeof section.visualContent === 'string' ? [`${section.label}: ${section.content}`] : []));
  const surfaces = present.flatMap((section) => (typeof section.visualContent === 'string'
    ? []
    : prefixedRows(`${section.label}: `, section.visualContent, width)));
  return [...(texts.length === 0 ? [] : contentRows(texts.join(' · '), width)), ...surfaces];
}

export {
  SELECTED_MARK, factsRows, joinRow, listEntries, presentSection, presentText, sectionVisual,
  selectedIndex, selectedText, stackRows, unmatchedSelectionRows,
};
