import { ctx } from '../_shared/setup.js';
import { skeleton, separator, box } from '@flyingrobots/bijou';

console.log(separator({ label: 'loading states', ctx }));
console.log();

// Single line skeleton
console.log('Title:');
console.log(skeleton({ width: 30, ctx }));
console.log();

// Multi-line skeleton (paragraph placeholder)
console.log('Body:');
console.log(skeleton({ width: 50, lines: 3, ctx }));
console.log();

// Card skeleton
console.log(separator({ label: 'card skeleton', ctx }));
console.log();
const cardContent = [
  skeleton({ width: 20, ctx }),
  '',
  skeleton({ width: 40, lines: 2, ctx }),
  '',
  skeleton({ width: 12, ctx }),
].join('\n');
console.log(box(cardContent, { padding: { top: 1, bottom: 1, left: 2, right: 2 }, ctx }));
