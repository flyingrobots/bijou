import { accordion, boxSurface, contentSurface, createAccordionState, interactiveAccordion } from './stories-runtime.js';
import type { BijouContext, Surface } from './stories-runtime.js';

export function progressiveDisclosurePreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly interactive: boolean;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    interactive,
  } = input;

  const sections = [
    {
      title: 'Build',
      content: 'Compile assets, freeze versions, and stamp the candidate build.',
      expanded: true,
    },
    {
      title: 'Review',
      content: 'Surface release notes, migration risks, and owner acknowledgements.',
      expanded: interactive,
    },
    {
      title: 'Promote',
      content: 'Roll canary traffic upward only after the review section is cleared.',
      expanded: false,
    },
  ];

  const body = interactive
    ? interactiveAccordion(createAccordionState(sections), { ctx })
    : accordion(sections, { ctx });

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      body,
    ].join('\n');
  }

  const panelWidth = Math.max(44, Math.min(width, 62));
  return boxSurface(contentSurface(body), {
    title,
    width: panelWidth,
    ctx,
  });
}
