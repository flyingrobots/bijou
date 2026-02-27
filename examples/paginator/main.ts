import { ctx } from '../_shared/setup.js';
import { paginator, separator } from '@flyingrobots/bijou';

console.log(separator({ label: 'dot style', ctx }));
console.log();

for (const page of [0, 4, 9]) {
  console.log(`Page ${page + 1}:  ${paginator({ current: page, total: 10, style: 'dots', ctx })}`);
}

console.log();
console.log(separator({ label: 'text style', ctx }));
console.log();

for (const page of [0, 4, 9]) {
  console.log(paginator({ current: page, total: 10, style: 'text', ctx }));
}
