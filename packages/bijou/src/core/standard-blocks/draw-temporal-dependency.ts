import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import {
  definedRows, factsRow, listEntries, presentSection, sectionText, selectedIndex, stackRows, textRow,
} from './draw-data-rows.js';

/** The `timeline()` glyphs: a filled and a hollow event dot, and the connector between events. */
const FILLED_DOT = '●';
const HOLLOW_DOT = '○';
const CONNECTOR = '│';
const DEPENDENCY_MARK = '↳';

/**
 * Draws `TemporalDependencyBlock` as its title over a vertical timeline of its
 * events, the selected event filled and the others hollow, then the dependency
 * and, when present, what the selected event depends on.
 */
export function drawTemporalDependency(input: StandardDrawInput): Surface {
  const { sections } = input;
  const events = listEntries(input.slots, sections, 'events');
  const selected = selectedIndex(events, presentSection(sections, 'selected')?.content);

  const timelineRows = events.flatMap((event, index) => {
    const dot = textRow(`${index === selected ? FILLED_DOT : HOLLOW_DOT} ${event}`);
    return index === events.length - 1 ? [dot] : [dot, textRow(CONNECTOR)];
  });
  const rows = [
    textRow(sectionText(sections, 'title')),
    ...timelineRows,
    textRow(`${DEPENDENCY_MARK} ${sectionText(sections, 'dependency')}`),
    factsRow(sections, ['dependsOn']),
  ];
  return stackRows(definedRows(rows), input.bounds.width);
}
