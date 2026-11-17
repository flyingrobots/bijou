import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { templateConsumerManifest } from './consumer-manifest.mjs';

describe('network preparation receives dependency data only', () => {
  it('captures the actual scaffold consumer ranges including its Node 22 types graph', () => {
    const source = readFileSync(new URL('../../packages/create-bijou-tui-app/src/index.part03.ts', import.meta.url), 'utf8');
    const manifest = templateConsumerManifest(source);
    expect(manifest.devDependencies).toEqual({ '@types/node': '^22.0.0', tsx: '^4.21.0', typescript: '^5.9.3' });
    expect(Object.keys(manifest.dependencies).sort()).toEqual([
      '@flyingrobots/bijou', '@flyingrobots/bijou-node', '@flyingrobots/bijou-tui', '@flyingrobots/bijou-tui-app',
    ]);
    expect(manifest).not.toHaveProperty('scripts');
  });
  it('refuses executable or ambiguous dependency declarations rather than evaluating them', () => {
    const invalid = [
      "dependencies: { lib: process.exit(0) }, devDependencies: { tool: '^1' }",
      "dependencies: { lib: '^1' }, dependencies: { lib: '^2' }, devDependencies: { tool: '^1' }",
      "dependencies: {\n lib: '^1',\n lib: '^2',\n}, devDependencies: {\n tool: '^1',\n}",
    ];
    for (const source of invalid) expect(() => templateConsumerManifest(source)).toThrow();
  });
  it('preserves each literal package range across a generated set of package names', () => {
    for (const count of [1, 2, 8, 32]) {
      const expected = Object.fromEntries(Array.from({ length: count }, (_, index) => [`@fixture/package-${String(index)}`, `^${String(index + 1)}.2.3`]));
      const dependencies = Object.entries(expected).map(([name, range]) => `  '${name}': '${range}',`).join('\n');
      const result = templateConsumerManifest(`dependencies: {\n${dependencies}\n}, devDependencies: {\n tool: '^1',\n}`);
      expect(result.dependencies).toEqual(expected);
    }
  });
});
