import { initDefaultContext } from '../../packages/bijou-node/src/index.js';
import { run } from '../../packages/bijou-tui/src/index.js';
import { createStorybookApp } from './storybook-app.js';

const ctx = initDefaultContext();
const initialStoryId = valueAfter(process.argv.slice(2), '--story');

await run(createStorybookApp(ctx, { initialStoryId }), { ctx, mouse: true });

function valueAfter(argv: readonly string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index < 0) return undefined;
  return argv[index + 1];
}
