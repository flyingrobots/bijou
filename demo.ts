import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, headerBox, progressBar, gradientText, separator, badge, alert, skeleton, kbd, tree, accordion, timeline } from '@flyingrobots/bijou';

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
console.log();
console.log(separator({ label: 'Data Components' }));
console.log();
console.log(tree([
  { label: 'src', children: [
    { label: 'components', children: [{ label: 'tree.ts' }, { label: 'accordion.ts' }, { label: 'timeline.ts' }] },
    { label: 'index.ts' },
  ]},
  { label: 'package.json' },
]));
console.log();
console.log(accordion([
  { title: 'Getting Started', content: 'npm install @flyingrobots/bijou', expanded: true },
  { title: 'Configuration', content: 'Set BIJOU_THEME to choose a preset' },
  { title: 'API Reference', content: 'See the README for full docs' },
]));
console.log();
console.log(timeline([
  { label: 'Project created', status: 'success' },
  { label: 'Tests passing', description: '42 tests', status: 'success' },
  { label: 'Code review', status: 'active' },
  { label: 'Deploy to production', status: 'pending' },
]));
