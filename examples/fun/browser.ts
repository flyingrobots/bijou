// Licensed under the Apache License, Version 2.0, like the rest of this repository.
// The browser entry: what a page that hosts the shell loads. It reaches no Node API, like the shell.
import type { BijouContext } from '@flyingrobots/bijou';
import type { App } from '@flyingrobots/bijou-tui';
import type { DemoEntry } from './contract.js';
import { demos } from './registry.js';
import { createFunApp, type ShellModel } from './shell.js';

/** What a page needs to mount the shell: how to build the app from the run's context. */
export interface FunBuild {
  readonly build: (ctx: BijouContext) => App<ShellModel>;
}

/**
 * The shell with the registry's demos, so a demo added to `registry.ts` appears in every page that hosts it.
 * `entries` replaces the registry, for a host that lists other demos. The page chooses the seed: demos never read the clock.
 */
export function funBuild(seed: number, entries: readonly DemoEntry[] = demos): FunBuild {
  return { build: (ctx) => createFunApp({ ctx, entries, seed }) };
}
