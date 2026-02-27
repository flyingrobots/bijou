import { ctx } from '../_shared/setup.js';
import { badge, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'badge variants', ctx }));
console.log();

console.log(
  badge('SUCCESS', { variant: 'success', ctx }),
  badge('ERROR', { variant: 'error', ctx }),
  badge('WARNING', { variant: 'warning', ctx }),
  badge('INFO', { variant: 'info', ctx }),
  badge('MUTED', { variant: 'muted', ctx }),
);
console.log();
console.log(
  badge('ACCENT', { variant: 'accent', ctx }),
  badge('PRIMARY', { variant: 'primary', ctx }),
);
console.log();

console.log(separator({ label: 'inline usage', ctx }));
console.log();

console.log(
  'Server is', badge('RUNNING', { variant: 'success', ctx }),
  'on port', badge('3000', { variant: 'primary', ctx }),
);
console.log();
console.log(
  'Build', badge('FAILED', { variant: 'error', ctx }),
  '— 3 errors, 1 warning',
);
console.log();
console.log(
  badge('v0.2.0', { variant: 'accent', ctx }),
  badge('MIT', { variant: 'muted', ctx }),
  badge('TypeScript', { variant: 'info', ctx }),
);
