import { initDefaultContext } from '../../packages/bijou-node/src/index.js';
import { run } from '../../packages/bijou-tui/src/index.js';
import { createDocsApp } from './app.js';
import { COMPONENT_STORIES } from './stories.js';

const ctx = initDefaultContext();
const initialStoryId = valueAfter(process.argv.slice(2), '--story') ?? COMPONENT_STORIES[0]?.id;

await run(createDocsApp(ctx, {
  initialRoute: 'docs',
  initialPageId: 'components',
  initialSelectedStoryId: initialStoryId,
}), { ctx, mouse: true });

function valueAfter(argv: readonly string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index < 0) return undefined;
  return argv[index + 1];
}
