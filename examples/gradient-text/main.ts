import { ctx } from '../_shared/setup.js';
import { gradientText, separator } from '@flyingrobots/bijou';

const cyanMagenta = ctx.theme.theme.gradient.brand;

console.log(separator({ label: 'gradient text', ctx }));
console.log();

console.log(gradientText('bijou — physics-powered TUI engine', cyanMagenta, { style: ctx.style }));
console.log();

console.log(gradientText('The quick brown fox jumps over the lazy dog.', cyanMagenta, { style: ctx.style }));
console.log();

console.log(separator({ label: 'multiline', ctx }));
console.log();

const banner = [
  '╔══════════════════════════════════╗',
  '║                                  ║',
  '║     Welcome to bijou v0.2.0      ║',
  '║                                  ║',
  '╚══════════════════════════════════╝',
].join('\n');

console.log(gradientText(banner, cyanMagenta, { style: ctx.style }));
