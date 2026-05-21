import type { BijouContext } from '../../packages/bijou/src/index.js';
import { createDocsApp } from './app.js';
import {
  createNodeDogfoodLocalePort,
  createNodeDogfoodLocalePreferencePort,
  type NodeDogfoodLocaleEnv,
} from './node-locale.js';

export function createNodeDocsApp(ctx: BijouContext, env?: NodeDogfoodLocaleEnv) {
  return createDocsApp(ctx, {
    localePort: createNodeDogfoodLocalePort(env),
    localePreferencePort: createNodeDogfoodLocalePreferencePort({ env }),
  });
}
