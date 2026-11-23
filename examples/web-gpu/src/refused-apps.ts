/** An example app the showcase cannot mount unmodified, and why. */
export interface RefusedApp {
  readonly id: string;
  readonly title: string;
  /** The app's module, from the repository root. */
  readonly module: string;
  readonly code: 'BIJOU_WEB_GPU_NODE_IMPORT';
  readonly reason: string;
}

/**
 * None today: every example app the showcase lists bundles with no Node.js
 * built-in. tests/web-gpu/node-imports.test.ts builds each one, and
 * tests/web-gpu/app-host-reach.test.ts walks each import graph for Node
 * host APIs. An app that regresses would be listed here, with its refusal.
 */
export const REFUSED_APPS: readonly RefusedApp[] = [];
