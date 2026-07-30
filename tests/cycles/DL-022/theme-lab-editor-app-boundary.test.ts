import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('DL-022 Theme Lab editor app boundary', () => {
  it('keeps Theme Lab editor key handling outside the public docs app facade', () => {
    const facadeSource = read('examples/docs/app.ts');
    const routeSource = read('examples/docs/app-docs-route-update.ts');

    expect(facadeSource.includes('app-theme-lab-editor-model')).toBe(false);
    expect(facadeSource.includes('app-theme-lab-key-handling')).toBe(false);
    expect(routeSource.includes('function updateThemeLabEditorFromKey(')).toBe(false);
    expect(routeSource.includes("from './app-theme-lab-key-handling.js'")).toBe(true);
  });
});
