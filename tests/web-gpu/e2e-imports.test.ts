import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The browser CI job runs `npm ci` and the suite with no package build, and Playwright loads every e2e file in Node.
// A value import that reaches a workspace package (directly, or through examples/fun or the showcase source) needs a
// built `dist` that job does not have. Type-only imports are erased and cost nothing.
const ROOT = join(import.meta.dirname, '..', '..', 'examples', 'web-gpu', 'e2e');
const files = readdirSync(ROOT).filter((name) => name.endsWith('.ts'));

/** Every module a file loads at run time: value imports, re-exports, side-effect imports and dynamic imports. */
function loaded(text: string): string[] {
  const statements = [...text.matchAll(/\b(import|export)(\s+type)?\s[^;]*?\sfrom\s+'([^']+)'/gu)].flatMap((m) => (m[2] === undefined && m[3] !== undefined ? [m[3]] : []));
  const bare = [...text.matchAll(/\bimport\s+'([^']+)'/gu)].flatMap((m) => (m[1] === undefined ? [] : [m[1]]));
  const dynamic = [...text.matchAll(/\bimport\(\s*'([^']+)'\s*\)/gu)].flatMap((m) => (m[1] === undefined ? [] : [m[1]]));
  return [...statements, ...bare, ...dynamic];
}

const allowed = (spec: string): boolean => spec === '@playwright/test' || spec.startsWith('node:') || /^\.\/[\w-]+(\.js)?$/u.test(spec);

describe('the web-gpu e2e files load only what the browser CI job has', () => {
  it('finds the e2e files', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('imports at run time only @playwright/test, Node built-ins and sibling e2e files', () => {
    const bad = files.flatMap((file) => loaded(readFileSync(join(ROOT, file), 'utf8')).filter((spec) => !allowed(spec)).map((spec) => `${file}: ${spec}`));
    expect(bad).toEqual([]);
  });

  it('sees a value import of examples/fun, so the rule is not vacuous', () => {
    expect(loaded("import { demos } from '../../fun/registry.js';\nimport type { X } from '../src/probe.js';")).toEqual(['../../fun/registry.js']);
  });
});
