import { enumeratedList } from '../components/enumerated-list.js';
import type { Surface } from '../../ports/surface.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import { ownSlotValue } from './render.part03.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { emphasisStyle, labelledLines, linesSurface, listItems, stackBlocks, wrappedLines } from './draw-text.js';

const DETAIL_IDS: readonly string[] = ['evidence', 'decision', 'nextStep'];

/**
 * Draws `ExplainabilityWalkthroughBlock` as a walkthrough: the title in bold,
 * the steps as a numbered list, then the evidence, decision and next step
 * that are present, each after its label.
 */
export function drawExplainabilityWalkthrough(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const stepsSection = input.sections.find((section) => section.id === 'steps');
  const steps = listItems(ownSlotValue(input.slots, 'steps'), stepsSection)
    .map((step) => sanitizePlainTerminalText(step));
  const blocks = [
    linesSurface(wrappedLines(sectionContent(input.sections, 'title') ?? '', width), width, emphasisStyle('primary')),
    linesSurface(wrappedLines(enumeratedList(steps, { style: 'arabic', indent: 0 }), width), width),
  ];
  const details = labelledLines(input.sections, DETAIL_IDS, width);
  if (details.length > 0) blocks.push(linesSurface(details, width));
  return stackBlocks(blocks, width);
}
