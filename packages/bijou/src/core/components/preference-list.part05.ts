import { createSurface, type Surface } from '../../ports/surface.js';
import { resolveSafeCtx as resolveCtx } from '../resolve-ctx.js';
import { isPreparedPreferenceSection, preparePreferenceRow, resolvePreferenceRowLayout } from './preference-list.part01.js';
import type { PreferenceListSurfaceOptions, PreferenceSection, PreparedPreferenceSection } from './preference-list.part01.js';
import { writePreferenceLine } from './preference-list.part02.js';
import { preferenceRowSurface } from './preference-list.part04.js';

export function preferenceListSurface(
  sections: readonly PreferenceSection[] | readonly PreparedPreferenceSection[],
  options: PreferenceListSurfaceOptions,
): Surface {
  const ctx = resolveCtx(options.ctx);
  const width = Math.max(1, Math.floor(options.width));
  const preparedSections = sections.map((section) => isPreparedPreferenceSection(section)
    ? section
    : {
        id: section.id,
        title: section.title,
        rows: section.rows.map((row) => preparePreferenceRow(row)),
      },
  );
  const visibleSections = preparedSections.filter((section) => section.rows.length > 0);
  let y = 0;

  for (const [sectionIndex, section] of visibleSections.entries()) {
    if (sectionIndex > 0) y += 1;
    y += 1;
    y += 1;

    for (const [rowIndex, row] of section.rows.entries()) {
      const rowLayout = resolvePreferenceRowLayout(row, width);
      y += rowLayout.height;
      if (rowIndex < section.rows.length - 1) y += 1;
    }
  }

  const totalHeight = Math.max(1, y);
  const surface = createSurface(width, totalHeight);
  y = 0;

  for (const [sectionIndex, section] of visibleSections.entries()) {
    if (sectionIndex > 0) y += 1;
    writePreferenceLine(surface, y, section.title, {
      strong: options.theme?.sectionTitleToken == null,
      fg: options.theme?.sectionTitleToken?.hex,
      fgRGB: options.theme?.sectionTitleToken?.fgRGB,
      bg: options.theme?.sectionTitleToken?.bg,
      bgRGB: options.theme?.sectionTitleToken?.bgRGB,
    });
    y += 2;

    for (const [rowIndex, row] of section.rows.entries()) {
      const rowLayout = resolvePreferenceRowLayout(row, width);
      const rowSurface = preferenceRowSurface(row, {
        width,
        selected: options.selectedRowId === row.row.id,
        ctx,
        theme: options.theme,
      });
      surface.blit(rowSurface, 0, y);
      y += rowLayout.height;
      if (rowIndex < section.rows.length - 1) y += 1;
    }
  }

  return surface;
}
