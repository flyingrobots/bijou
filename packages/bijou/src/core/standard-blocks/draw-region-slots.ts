import type { RenderSection } from './render.part01.js';
import type { RegionContent } from './draw-regions.js';
import { isPlainRecord, ownDataProperty } from './schema-utils.js';

/** The section with `id`, when the block shows it. */
function findSection(sections: readonly RenderSection[], id: string): RenderSection | undefined {
  return sections.find((section) => section.id === id);
}

/**
 * The region content of section `id`: one line per item when its slot is a
 * list of text, otherwise the section's own visual content.
 */
function listedContent(
  section: RenderSection,
  slots: Readonly<Record<string, unknown>> | undefined,
  prefix = '',
): RegionContent {
  const items = textItems(slots, section.id);
  if (items === undefined) return section.visualContent;
  return items.map((item) => `${prefix}${item}`).join('\n');
}

/**
 * The slot's items when it is a list of text, blank items left out. The list
 * and each item are read as own data properties, by index, so no accessor or
 * iterator of the slot value runs.
 */
function textItems(slots: Readonly<Record<string, unknown>> | undefined, id: string): readonly string[] | undefined {
  if (!isPlainRecord(slots)) return undefined;
  const value = ownDataProperty(slots, id);
  if (!Array.isArray(value)) return undefined;
  const items: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    const item: unknown = descriptor !== undefined && 'value' in descriptor ? descriptor.value : undefined;
    if (item === undefined) continue;
    if (typeof item !== 'string' && typeof item !== 'number') return undefined;
    if (String(item).trim() !== '') items.push(String(item));
  }
  return items.length === 0 ? undefined : items;
}

export { findSection, listedContent };
