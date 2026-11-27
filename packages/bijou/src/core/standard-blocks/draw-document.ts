import { alertSurface } from '../components/alert-v3.js';
import type { Surface } from '../../ports/surface.js';
import { sanitizePlainTerminalText } from '../text/index.js';
import { sectionContent, type StandardDrawInput } from './draw-input.js';
import { emphasisStyle, linesSurface, mutedStyle, stackBlocks, wrappedLines } from './draw-text.js';

const CODE_INDENT = '  ';
/** The alert frame (two columns) plus its icon and the space after it (two columns). */
const CALLOUT_CHROME = 4;

function calloutSurface(callout: string, width: number): Surface {
  const messageWidth = width - CALLOUT_CHROME;
  return alertSurface(linesSurface(wrappedLines(callout, messageWidth), messageWidth), { variant: 'info' });
}

/** Code keeps its own lines and indentation: it is clipped at the edge, never wrapped. */
function codeSurface(code: string, width: number): Surface {
  const lines = sanitizePlainTerminalText(code, { preserveNewlines: true }).split('\n');
  return linesSurface(lines.map((line) => `${CODE_INDENT}${line}`), width, mutedStyle());
}

/**
 * Draws `FormattedDocumentBlock` as a formatted document: the heading in bold,
 * the body wrapped as prose, the optional callout as an info alert and the
 * optional code as an indented code block.
 */
export function drawFormattedDocument(input: StandardDrawInput): Surface {
  const width = input.bounds.width;
  const blocks = [
    linesSurface(wrappedLines(sectionContent(input.sections, 'heading') ?? '', width), width, emphasisStyle('primary')),
    linesSurface(wrappedLines(sectionContent(input.sections, 'body') ?? '', width), width),
  ];
  const callout = sectionContent(input.sections, 'callout');
  if (callout !== undefined) blocks.push(calloutSurface(callout, width));
  const code = sectionContent(input.sections, 'code');
  if (code !== undefined) blocks.push(codeSurface(code, width));
  return stackBlocks(blocks, width);
}
