import { createTextSurface } from '../components/surface-text.js';
import type { Surface } from '../../ports/surface.js';
import type { StandardDrawInput } from './draw-input.js';
import { factsRows, listEntries, selectedText, sectionVisual, selectedIndex, stackRows } from './draw-data-rows.js';
import { contentRows, prefixedRows } from './draw-data-wrap.js';

/** The `timeline()` glyphs: a filled and a hollow event dot, and the connector between events. */
const FILLED_DOT = '●';
const HOLLOW_DOT = '○';
const CONNECTOR = '│';
const DEPENDENCY_MARK = '↳';

/**
 * Draws `TemporalDependencyBlock` as its title over a vertical timeline of its
 * events, the selected event filled and the others hollow, then the dependency
 * and, when present, what the selected event depends on. A long event wraps
 * beside the connector line.
 */
export function drawTemporalDependency(input: StandardDrawInput): Surface {
  const { sections } = input;
  const width = input.bounds.width;
  const events = listEntries(input.slots, sections, 'events');
  const selected = selectedIndex(events, selectedText(sections));

  const timelineRows = events.flatMap((event, index) => {
    const last = index === events.length - 1;
    const dot = prefixedRows(`${index === selected ? FILLED_DOT : HOLLOW_DOT} `, event, width, last ? '  ' : `${CONNECTOR} `);
    return last ? dot : [...dot, createTextSurface(CONNECTOR)];
  });
  const rows = [
    ...contentRows(sectionVisual(sections, 'title'), width),
    ...timelineRows,
    ...prefixedRows(`${DEPENDENCY_MARK} `, sectionVisual(sections, 'dependency'), width),
    ...factsRows(sections, ['dependsOn'], width),
  ];
  return stackRows(rows, width);
}
