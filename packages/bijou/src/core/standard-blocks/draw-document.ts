import { alertSurface } from '../components/alert-v3.js';
import type { Surface } from '../../ports/surface.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import type { StandardDrawInput } from './draw-input.js';
import { findSection, pieceSurface, prefixedSurface, sectionPiece, type SlotPiece } from './draw-slot.js';
import { emphasisStyle, linesSurface, mutedStyle, stackBlocks } from './draw-text.js';

const CODE_INDENT = '  ';
/** The alert frame (two columns) plus its icon and the space after it (two columns). */
const CALLOUT_CHROME = 4;

function calloutSurface(callout: SlotPiece, width: number): Surface {
  return alertSurface(pieceSurface(callout, width - CALLOUT_CHROME), { variant: 'info' });
}

/** Code keeps its own lines and indentation: it is clipped at the edge, never wrapped. */
function codeSurface(code: SlotPiece, width: number): Surface {
  if (typeof code !== 'string') return prefixedSurface(CODE_INDENT, code, width);
  const lines = sanitizePlainTerminalText(code, { preserveNewlines: true }).split('\n');
  return linesSurface(lines.map((line) => `${CODE_INDENT}${line}`), width, mutedStyle());
}

/**
 * Draws `FormattedDocumentBlock` as a formatted document: the heading in bold,
 * the body wrapped as prose, the optional callout as an info alert and the
 * optional code as an indented code block. A nested Surface in any slot is
 * drawn with its own cells.
 */
export function drawFormattedDocument(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const blocks = [
    pieceSurface(sectionPiece(findSection(input.sections, 'heading')), width, emphasisStyle('primary')),
    pieceSurface(sectionPiece(findSection(input.sections, 'body')), width),
  ];
  const callout = findSection(input.sections, 'callout');
  if (callout !== undefined) blocks.push(calloutSurface(callout.visualContent, width));
  const code = findSection(input.sections, 'code');
  if (code !== undefined) blocks.push(codeSurface(code.visualContent, width));
  return stackBlocks(blocks, width);
}
