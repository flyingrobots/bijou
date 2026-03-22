import { createNodeContext } from '@flyingrobots/bijou-node';
import {
  box,
  alert,
  progressBar,
  separatorSurface,
  gradientText,
  PRESETS,
  setDefaultContext,
} from '@flyingrobots/bijou';
import { createBijou } from '@flyingrobots/bijou';
import { nodeRuntime } from '@flyingrobots/bijou-node';
import { nodeIO } from '@flyingrobots/bijou-node';
import { chalkStyle } from '@flyingrobots/bijou-node';
import {
  badgeSurface,
  column,
  contentSurface,
  renderSurface,
  row,
  spacer,
} from '../_shared/example-surfaces.ts';

// Show the same components rendered in each built-in theme.

function renderTheme(themeName: string): void {
  // Set the theme via env and create a context
  process.env.BIJOU_THEME = themeName;
  const ctx = createBijou({
    runtime: nodeRuntime(),
    io: nodeIO(),
    style: chalkStyle(false),
  });

  const stops = ctx.theme.theme.gradient.brand;
  const output = column([
    separatorSurface({ label: themeName, ctx }),
    spacer(1, 1),
    contentSurface(gradientText(`  Theme: ${themeName}`, stops, { style: ctx.style })),
    spacer(1, 1),
    contentSurface(box('Hello, bijou!', { ctx })),
    spacer(1, 1),
    row([
      badgeSurface('SUCCESS', 'success', ctx),
      ' ',
      badgeSurface('ERROR', 'error', ctx),
      ' ',
      badgeSurface('WARNING', 'warning', ctx),
      ' ',
      badgeSurface('INFO', 'info', ctx),
      ' ',
      badgeSurface('MUTED', 'muted', ctx),
    ]),
    spacer(1, 1),
    contentSurface(alert('All systems operational.', { variant: 'success', ctx })),
    spacer(1, 1),
    contentSurface(progressBar(75, { width: 40, showPercent: true, ctx })),
    spacer(1, 1),
  ]);

  console.log(renderSurface(output, ctx));
}

// Initialize a default context first
const defaultCtx = createNodeContext();
setDefaultContext(defaultCtx);

for (const name of Object.keys(PRESETS)) {
  renderTheme(name);
}
