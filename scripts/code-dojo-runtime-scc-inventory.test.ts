import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RUNTIME_SCC_INVENTORY_PATH } from './code-dojo-runtime-scc-cli.js';
import { inventoryInconsistencies, parseRuntimeSccInventory } from './code-dojo-runtime-scc-inventory.js';
import { serializeRuntimeSccInventory } from './code-dojo-runtime-scc.js';
import { validateInventory } from './code-dojo-runtime-scc-schemas.test-support.js';

const ROOT = new URL('../', import.meta.url);
const text = readFileSync(new URL(RUNTIME_SCC_INVENTORY_PATH, ROOT), 'utf8');

function committed(): ReturnType<typeof parseRuntimeSccInventory> {
  return parseRuntimeSccInventory(JSON.parse(text));
}

describe('committed runtime SCC inventory', () => {
  it('validates against its JSON Schema', () => {
    const parsed: unknown = JSON.parse(text);

    expect(validateInventory(parsed), JSON.stringify(validateInventory.errors)).toBe(true);
  });

  it('is internally consistent and in canonical byte form', () => {
    const inventory = committed();

    expect(typeof inventory).not.toBe('string');
    if (typeof inventory === 'string') return;
    expect(inventoryInconsistencies(inventory)).toEqual([]);
    expect(serializeRuntimeSccInventory(inventory)).toBe(text);
  });

  it('names only modules that exist in the tree', () => {
    const inventory = committed();
    if (typeof inventory === 'string') throw new Error(inventory);
    const missing = inventory.components.flatMap((component) => component.modules)
      .filter((module) => !existsSync(new URL(module, ROOT)));

    expect(missing).toEqual([]);
  });

  it('detects an inconsistent inventory', () => {
    const inventory = committed();
    if (typeof inventory === 'string') throw new Error(inventory);
    const tampered = {
      ...inventory,
      componentCount: 99,
      moduleCount: 99,
      components: [{ id: 'scripts/z.ts', area: 'tests', modules: ['scripts/z.ts', 'scripts/a.ts'], edges: [] }],
    };

    expect(inventoryInconsistencies(tampered)).toEqual(expect.arrayContaining([
      'componentCount does not match components',
      'moduleCount does not match components',
      'scripts/z.ts: modules are not sorted',
      'scripts/z.ts: id is not the first module',
      'scripts/z.ts: area is not scripts',
      'scripts/z.ts: edges do not make the modules one strongly connected component',
    ]));
  });
});
