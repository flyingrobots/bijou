import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BIJOU_DARK } from '../../../packages/bijou/src/index.js';
import { themeLabGraphNodes } from '../../../examples/docs/app-theme-lab-graph.js';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('DL-022 Theme Lab editor graph UX dependents', () => {
  it('lists status semantic dependents in the Theme Lab graph', () => {
    const nodes = themeLabGraphNodes(BIJOU_DARK, BIJOU_DARK);
    const success = nodes.find((node) => node.path === 'status.success');
    const error = nodes.find((node) => node.path === 'status.error');

    expect(success?.edges).toContain('semantic.success');
    expect(success?.edges).toContain('border.success');
    expect(error?.edges).toContain('semantic.error');
    expect(error?.edges).toContain('border.error');
  });

  it('uses one shared row renderer for editor and graph token rows', () => {
    const renderingSource = read('examples/docs/app-theme-lab-editor-rendering.ts');
    const graphSource = read('examples/docs/app-theme-lab-editor-graph-view.ts');
    const editorSource = read('examples/docs/app-theme-lab-editor-view.ts');

    expect(renderingSource).toContain('export function renderThemeTokenRow');
    expect(graphSource).toContain('renderThemeTokenRow(');
    expect(editorSource).toContain('renderThemeTokenRow(');
    expect(graphSource).not.toContain('renderSwatch');
  });
});
