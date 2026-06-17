import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('showcase registry', () => {
  it('preserves category titles consumed by createShowcaseApp', async () => {
    const registry = await loadShowcaseRegistry();

    expect(registry.CATEGORIES.map((category) => category.title)).toEqual([
      'Display',
      'Data',
      'Forms',
      'TUI',
    ]);
  });
});

interface ShowcaseRegistry {
  readonly CATEGORIES: readonly {
    readonly title: unknown;
  }[];
}

async function loadShowcaseRegistry(): Promise<ShowcaseRegistry> {
  const registryModule: unknown = await import(
    pathToFileURL(resolve(ROOT, 'examples/showcase/registry.ts')).href
  );
  if (!isShowcaseRegistry(registryModule)) {
    throw new Error('showcase registry module did not export CATEGORIES');
  }
  return registryModule;
}

function isShowcaseRegistry(value: unknown): value is ShowcaseRegistry {
  if (value == null || typeof value !== 'object' || !('CATEGORIES' in value)) {
    return false;
  }
  const categories = value.CATEGORIES;
  return Array.isArray(categories) && categories.every((category) => {
    return category != null && typeof category === 'object' && 'title' in category;
  });
}
