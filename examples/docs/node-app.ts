import type { BijouContext } from '../../packages/bijou/src/index.js';
import type { RunOptions } from '../../packages/bijou-tui/src/index.js';
import { createDocsApp, runDocsApp } from './app.js';
import { createNodeDogfoodLocalePort, type NodeDogfoodLocaleEnv } from './node-locale.js';

type DocsRunOptions = NonNullable<Parameters<typeof runDocsApp>[2]> & Pick<RunOptions<never>, never>;

export function createNodeDocsApp(ctx: BijouContext, env?: NodeDogfoodLocaleEnv) {
  return createDocsApp(ctx, {
    localePort: createNodeDogfoodLocalePort(env),
  });
}

export async function runNodeDocsApp(
  ctx: BijouContext,
  env?: NodeDogfoodLocaleEnv,
  runOptions?: DocsRunOptions,
): Promise<void> {
  await runDocsApp(ctx, {
    localePort: createNodeDogfoodLocalePort(env),
  }, runOptions);
}
