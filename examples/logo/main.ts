import { initDefaultContext } from '@flyingrobots/bijou-node';
import { loadRandomLogo, separator, box, headerBox } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

console.log(separator({ label: 'Bijou Random Logos', ctx }));
console.log();

const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

for (const size of sizes) {
  const logo = loadRandomLogo({ size });
  console.log(headerBox(`Size: \${size}`, { ctx }));
  console.log(box(logo.ascii, { padding: { top: 1, bottom: 1, left: 2, right: 2 }, ctx }));
  console.log();
}
