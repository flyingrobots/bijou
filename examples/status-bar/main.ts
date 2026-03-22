import { ctx } from '../_shared/setup.js';
import { separatorSurface } from '@flyingrobots/bijou';
import { statusBarSurface } from '@flyingrobots/bijou-tui';
import { column, line, renderSurface } from '../_shared/example-surfaces.ts';

const surface = column([
  line(''),
  separatorSurface({ label: 'status bar examples', ctx }),
  line(''),
  statusBarSurface({ left: 'main.ts', center: 'TypeScript', right: 'Ln 42, Col 8', width: 60 }),
  line(''),
  statusBarSurface({ left: 'NORMAL', right: '1/150', width: 60, fillChar: '─' }),
  line(''),
  statusBarSurface({ left: '⏺ Recording', center: '00:12', right: '🔴 LIVE', width: 60 }),
]);

console.log(renderSurface(surface, ctx));
