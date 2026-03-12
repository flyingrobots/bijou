import { ctx } from '../_shared/setup.js';
import { badge, separator, surfaceToString } from '@flyingrobots/bijou';

function badgeText(label: string, variant: Parameters<typeof badge>[1]['variant']): string {
  return surfaceToString(badge(label, { variant, ctx }), ctx.style);
}

console.log(separator({ label: 'badge variants', ctx }));
console.log();

console.log(
  badgeText('SUCCESS', 'success'),
  badgeText('ERROR', 'error'),
  badgeText('WARNING', 'warning'),
  badgeText('INFO', 'info'),
  badgeText('MUTED', 'muted'),
);
console.log();
console.log(
  badgeText('ACCENT', 'accent'),
  badgeText('PRIMARY', 'primary'),
);
console.log();

console.log(separator({ label: 'inline usage', ctx }));
console.log();

console.log(
  'Server is', badgeText('RUNNING', 'success'),
  'on port', badgeText('3000', 'primary'),
);
console.log();
console.log(
  'Build', badgeText('FAILED', 'error'),
  '— 3 errors, 1 warning',
);
console.log();
console.log(
  badgeText('v0.2.0', 'accent'),
  badgeText('MIT', 'muted'),
  badgeText('TypeScript', 'info'),
);
