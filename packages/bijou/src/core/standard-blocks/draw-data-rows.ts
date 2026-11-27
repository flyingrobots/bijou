import { createTextSurface } from '../components/surface-text.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import { createSurface, type Surface } from '../../ports/surface.js';
import type { RenderSection } from './render.part01.js';
import { ownSlotValue, slotValueText } from './render.part03.js';

/** The gutter glyph that marks the selected entry of a drawn data block. */
const SELECTED_MARK = '▸';

/** One row of untrusted slot text, sanitized, with line breaks folded to spaces. */
function textRow(text: string): Surface {
  return createTextSurface(sanitizePlainTerminalText(text));
}

/** Rows stacked top to bottom on a Surface exactly `width` columns wide; wider rows are clipped. */
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

/** Surfaces placed side by side on one row, `gap` blank columns apart. */
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

/** The text of section `id`, including its missing-slot text when it is required and absent. */
function sectionText(sections: readonly RenderSection[], id: string): string {
  return sections.find((section) => section.id === id)?.content ?? '';
}

/** The entries of list slot `id`; a non-list value, or the missing-slot text, is one entry. */
function listEntries(
  slots: Readonly<Record<string, unknown>> | undefined,
  sections: readonly RenderSection[],
  id: string,
): readonly string[] {
  const value: unknown = ownSlotValue(slots, id);
  if (Array.isArray(value)) {
    const items: readonly unknown[] = value;
    const entries = items
      .map((item) => slotValueText(item))
      .filter((item): item is string => item !== undefined && item.trim() !== '');
    if (entries.length > 0) return entries;
  }
  const text = sectionText(sections, id);
  return text === '' ? [] : [text];
}

/**
 * The index of the entry that `selected` names: an exact match first, then the
 * first entry that starts or ends with `selected` as a whole word. -1 when none does.
 */
function selectedIndex(entries: readonly string[], selected: string | undefined): number {
  if (selected === undefined || selected.trim() === '') return -1;
  const exact = entries.indexOf(selected);
  if (exact !== -1) return exact;
  return entries.findIndex((entry) => entry.startsWith(`${selected} `) || entry.endsWith(` ${selected}`));
}

/** `Label: text` for each present section in `ids`, joined on one row; undefined when none is present. */
function factsRow(sections: readonly RenderSection[], ids: readonly string[]): Surface | undefined {
  const facts = ids.flatMap((id) => {
    const section = presentSection(sections, id);
    return section === undefined ? [] : [`${section.label}: ${section.content}`];
  });
  return facts.length === 0 ? undefined : textRow(facts.join(' · '));
}

/** The missing-slot text of required section `id` as a row, when the slot is absent. */
function missingRow(sections: readonly RenderSection[], id: string): Surface | undefined {
  const section = sections.find((candidate) => candidate.id === id);
  return section === undefined || section.present ? undefined : textRow(section.content);
}

/** The rows that are defined, in order. */
function definedRows(rows: readonly (Surface | undefined)[]): readonly Surface[] {
  return rows.filter((row): row is Surface => row !== undefined);
}

export {
  SELECTED_MARK, definedRows, factsRow, joinRow, listEntries, missingRow, presentSection,
  sectionText, selectedIndex, stackRows, textRow,
};
