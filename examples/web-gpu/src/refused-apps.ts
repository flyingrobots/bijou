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
 * Checked by tests/web-gpu/node-imports.test.ts, which builds each app's
 * module with the showcase's Vite configuration and expects this refusal.
 */
export const REFUSED_APPS: readonly RefusedApp[] = [
  {
    id: 'components', title: 'Components library', module: 'examples/components/library.ts', code: 'BIJOU_WEB_GPU_NODE_IMPORT',
    reason: 'node:fs imported by examples/components/library-font.ts',
  },
  {
    id: 'hero', title: 'Hero', module: 'examples/hero/app.ts', code: 'BIJOU_WEB_GPU_NODE_IMPORT',
    reason: 'node:fs imported by examples/docs/app-cylinder-font.ts',
  },
];
