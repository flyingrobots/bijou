import type { ScriptStep } from '@flyingrobots/bijou-tui';
import type { createDocsApp } from '../examples/docs/app.js';

export type DocsApp = ReturnType<typeof createDocsApp>;
export type DocsRootModel = ReturnType<DocsApp['init']>[0];
export type DocsPageModel = DocsRootModel['docsModel']['pageModels'][string];
export type DocsRootMsg = Extract<Parameters<DocsApp['update']>[0], { readonly type: 'docs' }>;
export type DocsScriptStep = ScriptStep<DocsRootMsg>;

export interface LocaleCatalogEntry {
  readonly key: { readonly namespace: string; readonly id: string };
  readonly kind: 'message' | 'resource' | 'data';
  readonly sourceLocale: string;
  readonly values: Readonly<Record<string, unknown>>;
  readonly fallbackValue?: unknown;
}

export interface LocaleCatalog {
  readonly namespace: string;
  readonly entries: readonly LocaleCatalogEntry[];
}
