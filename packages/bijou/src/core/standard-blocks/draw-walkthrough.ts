import type { Surface } from '../../ports/surface.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import { ownSlotValue } from './render.part03.js';
import type { StandardDrawInput } from './draw-input.js';
import { findSection, labelledSurfaces, listPieces, pieceSurface, prefixedSurface, sectionPiece } from './draw-slot.js';
import { emphasisStyle, stackBlocks } from './draw-text.js';

const DETAIL_IDS: readonly string[] = ['evidence', 'decision', 'nextStep'];

/**
 * Draws `ExplainabilityWalkthroughBlock` as a walkthrough: the title in bold,
 * the steps as a numbered list, then the evidence, decision and next step
 * that are present, each after its label. Numbers are padded to the widest,
 * so every step's text starts in the same column.
 */
export function drawExplainabilityWalkthrough(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const steps = listPieces(ownSlotValue(input.slots, 'steps'), findSection(input.sections, 'steps'));
  const numberWidth = `${String(steps.length)}. `.length;
  const stepRows = steps.map((step, index) => prefixedSurface(
    `${String(index + 1)}. `.padEnd(numberWidth),
    typeof step === 'string' ? sanitizePlainTerminalText(step) : step,
    width,
  ));
  const blocks = [
    pieceSurface(sectionPiece(findSection(input.sections, 'title')), width, emphasisStyle('primary')),
    stackBlocks(stepRows, width, 0),
  ];
  const details = labelledSurfaces(input.sections, DETAIL_IDS, width);
  if (details.length > 0) blocks.push(stackBlocks(details, width, 0));
  return stackBlocks(blocks, width);
}
