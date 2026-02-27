import { ctx } from '../_shared/setup.js';
import { tabs, separator, box } from '@flyingrobots/bijou';

console.log(separator({ label: 'basic tabs', ctx }));
console.log();

const items = [
  { label: 'Overview' },
  { label: 'Components' },
  { label: 'Forms' },
  { label: 'Theme' },
];

console.log(tabs(items, { active: 0, ctx }));
console.log(box('Welcome to the bijou component library.', { ctx }));

console.log();

console.log(tabs(items, { active: 1, ctx }));
console.log(box('box, table, tree, badge, alert, separator...', { ctx }));

console.log();
console.log(separator({ label: 'tabs with badges', ctx }));
console.log();

console.log(tabs([
  { label: 'All', badge: '42' },
  { label: 'Open', badge: '12' },
  { label: 'Closed', badge: '30' },
  { label: 'Draft' },
], { active: 1, ctx }));
