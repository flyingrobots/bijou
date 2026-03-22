import { ctx } from '../_shared/setup.js';
import { separatorSurface } from '@flyingrobots/bijou';
import {
  badgeSurface,
  column,
  renderSurface,
  row,
  spacer,
} from '../_shared/example-surfaces.ts';

const output = column([
  separatorSurface({ label: 'badge variants', ctx }),
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
  row([
    badgeSurface('ACCENT', 'accent', ctx),
    ' ',
    badgeSurface('PRIMARY', 'primary', ctx),
  ]),
  spacer(1, 1),
  separatorSurface({ label: 'inline usage', ctx }),
  spacer(1, 1),
  row([
    'Server is ',
    badgeSurface('RUNNING', 'success', ctx),
    ' on port ',
    badgeSurface('3000', 'primary', ctx),
  ]),
  spacer(1, 1),
  row([
    'Build ',
    badgeSurface('FAILED', 'error', ctx),
    ' — 3 errors, 1 warning',
  ]),
  spacer(1, 1),
  row([
    badgeSurface('v0.2.0', 'accent', ctx),
    ' ',
    badgeSurface('MIT', 'muted', ctx),
    ' ',
    badgeSurface('TypeScript', 'info', ctx),
  ]),
]);

console.log(renderSurface(output, ctx));
