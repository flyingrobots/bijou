import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, headerBox, progressBar, gradientText, separator, badge, alert, skeleton, kbd } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

const stops = [
  { pos: 0, color: [0, 200, 255] as [number, number, number] },
  { pos: 1, color: [255, 0, 128] as [number, number, number] },
];

console.log(gradientText('Hello from bijou!', stops, { style: ctx.style }));
console.log();
console.log(box('Simple bordered box'));
console.log();
console.log(headerBox('Deploy', { detail: 'v1.2.3 → production' }));
console.log();
console.log(progressBar(75));
console.log();
console.log(separator({ label: 'New Components' }));
console.log();
console.log(badge('SUCCESS', { variant: 'success' }), badge('ERROR', { variant: 'error' }), badge('WARNING', { variant: 'warning' }), badge('INFO'), badge('MUTED', { variant: 'muted' }));
console.log();
console.log(alert('Deployment completed successfully!', { variant: 'success' }));
console.log();
console.log(alert('Something went wrong.', { variant: 'error' }));
console.log();
console.log('Loading:');
console.log(skeleton({ width: 40, lines: 3 }));
console.log();
console.log('Press', kbd('Ctrl+C'), 'to exit or', kbd('Enter'), 'to continue');
