import { initDefaultContext } from '@flyingrobots/bijou-node';
import {
  box, headerBox, progressBar, gradientText, separator, badge, alert,
  skeleton, kbd, tree, accordion, timeline, select, PRESETS
} from '@flyingrobots/bijou';

async function runDemo() {
  const ctx = initDefaultContext();

  const themeName = await select({
    title: 'Choose a theme to preview the bijou component library:',
    options: Object.keys(PRESETS).map(name => ({ label: name, value: name })),
    ctx
  });

  // Re-initialize context with the chosen theme
  process.env.BIJOU_THEME = themeName;
  const themedCtx = initDefaultContext();

  const stops = themedCtx.theme.theme.gradient.brand;

  console.log(gradientText(`Showing bijou with theme: ${themeName}`, stops, { style: themedCtx.style }));
  console.log();
  console.log(box('Simple bordered box', { ctx: themedCtx }));
  console.log();
  console.log(headerBox('Deploy', { detail: 'v1.2.3 → production', ctx: themedCtx }));
  console.log();
  console.log(progressBar(75, { ctx: themedCtx }));
  console.log();
  console.log(separator({ label: 'New Components', ctx: themedCtx }));
  console.log();
  console.log(
    badge('SUCCESS', { variant: 'success', ctx: themedCtx }),
    badge('ERROR', { variant: 'error', ctx: themedCtx }),
    badge('WARNING', { variant: 'warning', ctx: themedCtx }),
    badge('INFO', { ctx: themedCtx }),
    badge('MUTED', { variant: 'muted', ctx: themedCtx })
  );
  console.log();
  console.log(alert('Deployment completed successfully!', { variant: 'success', ctx: themedCtx }));
  console.log();
  console.log(alert('Something went wrong.', { variant: 'error', ctx: themedCtx }));
  console.log();
  console.log('Loading:');
  console.log(skeleton({ width: 40, lines: 3, ctx: themedCtx }));
  console.log();
  console.log('Press', kbd('Ctrl+C', { ctx: themedCtx }), 'to exit or', kbd('Enter', { ctx: themedCtx }), 'to continue');
  console.log();
  console.log(separator({ label: 'Data Components', ctx: themedCtx }));
  console.log();
  console.log(tree([
    { label: 'src', children: [
      { label: 'components', children: [{ label: 'tree.ts' }, { label: 'accordion.ts' }, { label: 'timeline.ts' }] },
      { label: 'index.ts' },
    ]},
    { label: 'package.json' },
  ], { ctx: themedCtx }));
  console.log();
  console.log(accordion([
    { title: 'Getting Started', content: 'npm install @flyingrobots/bijou', expanded: true },
    { title: 'Configuration', content: 'Set BIJOU_THEME to choose a preset' },
    { title: 'API Reference', content: 'See the README for full docs' },
  ], { ctx: themedCtx }));
  console.log();
  console.log(timeline([
    { label: 'Project created', status: 'success' },
    { label: 'Tests passing', description: '42 tests', status: 'success' },
    { label: 'Code review', status: 'active' },
    { label: 'Deploy to production', status: 'pending' },
  ], { ctx: themedCtx }));
}

runDemo().catch(console.error);
