import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../../..');

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('DL-022 Theme Lab editor app boundary', () => {
  it('keeps Theme Lab editor key handling outside the legacy docs app shell', () => {
    const appSource = read('examples/docs/app.ts');

    expect(appSource.includes("from './app-theme-lab-editor-model.js'")).toBe(false);
    expect(appSource.includes('function updateThemeLabEditorFromKey(')).toBe(false);
    expect(appSource.includes("from './app-theme-lab-key-handling.js'")).toBe(true);
  });
});
