import { clipToWidth } from '../text/clip.js';
import { graphemeWidth } from '../text/grapheme.js';
import { wrapToWidth } from '../text/wrap.js';
import type { OverflowBehavior } from './types.js';

const BORDER = {
  tl: '\u250c',
  tr: '\u2510',
  bl: '\u2514',
  br: '\u2518',
  h: '\u2500',
  v: '\u2502',
};

export interface BoxPadding {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export function drawBox(
  content: string,
  borderColor: (text: string) => string,
  padding: BoxPadding,
  fixedWidth?: number,
  backgroundFill?: (text: string) => string,
  fillCharacter = ' ',
  title?: string,
  overflow: OverflowBehavior = 'wrap',
): string {
  const rawContentLines = content.split('\n');
  let innerWidth: number;
  let contentWidth: number;
  if (fixedWidth !== undefined) {
    innerWidth = Math.max(0, fixedWidth - 2);
    contentWidth = Math.max(0, innerWidth - padding.left - padding.right);
  } else {
    const titleWidth = title ? graphemeWidth(title) + 2 : 0;
    const maxWidth = rawContentLines.reduce(
      (maximum, line) => Math.max(maximum, graphemeWidth(line)),
      0,
    );
    contentWidth = maxWidth;
    innerWidth = Math.max(titleWidth, maxWidth + padding.left + padding.right);
  }

  const effectiveLeft =
    fixedWidth === undefined
      ? padding.left
      : Math.min(padding.left, innerWidth);
  const effectiveRight =
    fixedWidth === undefined
      ? padding.right
      : Math.min(padding.right, Math.max(0, innerWidth - effectiveLeft));
  const contentLines =
    fixedWidth !== undefined && overflow === 'wrap'
      ? rawContentLines.flatMap((line) => wrapToWidth(line, contentWidth))
      : rawContentLines;

  const pad = (line: string): string => {
    const visible = graphemeWidth(line);
    const processed =
      visible > contentWidth ? clipToWidth(line, contentWidth) : line;
    const left = fillCharacter.repeat(effectiveLeft);
    const right = fillCharacter.repeat(
      effectiveRight + Math.max(0, contentWidth - graphemeWidth(processed)),
    );
    return left + processed + right;
  };
  const fill = backgroundFill ?? ((text: string) => text);

  let topBorder = BORDER.h.repeat(innerWidth);
  if (title && innerWidth >= 4) {
    const label = ` ${title} `;
    const labelWidth = graphemeWidth(label);
    if (labelWidth <= innerWidth - 2) {
      topBorder =
        BORDER.h + label + BORDER.h.repeat(innerWidth - 1 - labelWidth);
    } else {
      const clipped = clipToWidth(label, innerWidth - 2);
      topBorder =
        BORDER.h +
        clipped +
        BORDER.h.repeat(innerWidth - 1 - graphemeWidth(clipped));
    }
  }

  const top = borderColor(BORDER.tl + topBorder + BORDER.tr);
  const bottom = borderColor(
    BORDER.bl + BORDER.h.repeat(innerWidth) + BORDER.br,
  );
  const emptyLine =
    borderColor(BORDER.v) +
    fill(fillCharacter.repeat(innerWidth)) +
    borderColor(BORDER.v);
  const lines = [top];
  for (let index = 0; index < padding.top; index++) lines.push(emptyLine);
  for (const line of contentLines) {
    lines.push(borderColor(BORDER.v) + fill(pad(line)) + borderColor(BORDER.v));
  }
  for (let index = 0; index < padding.bottom; index++) {
    lines.push(emptyLine);
  }
  lines.push(bottom);
  return lines.join('\n');
}
