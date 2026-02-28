import { ctx } from '../_shared/setup.js';
import { separator } from '@flyingrobots/bijou';
import { statusBar } from '@flyingrobots/bijou-tui';

// Show a few status bar examples
console.log(separator({ label: 'status bar examples', ctx }));
console.log();
console.log(statusBar({ left: 'main.ts', center: 'TypeScript', right: 'Ln 42, Col 8', width: 60, ctx }));
console.log();
console.log(statusBar({ left: 'NORMAL', right: '1/150', width: 60, fillChar: '─', ctx }));
console.log();
console.log(statusBar({ left: '⏺ Recording', center: '00:12', right: '🔴 LIVE', width: 60, ctx }));
