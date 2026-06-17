import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BijouContext } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
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

  it('renders the display badge showcase entry with its surface helpers', async () => {
    const registry = await loadShowcaseRegistry();
    const entry = findRegistryEntry(registry, 'Display', 'badge');
    const ctx = createTestContext();

    expect(entry.render(80, ctx)).toBeTruthy();
  });

  it('renders the TUI status bar showcase entry with its surface helper', async () => {
    const registry = await loadShowcaseRegistry();
    const entry = findRegistryEntry(registry, 'TUI', 'status-bar');
    const ctx = createTestContext();

    expect(entry.render(80, ctx)).toBeTruthy();
  });
});

interface ShowcaseRegistry {
  readonly CATEGORIES: readonly ShowcaseCategory[];
}

interface ShowcaseCategory {
  readonly title: unknown;
  readonly entries: readonly unknown[];
}

interface ShowcaseEntry {
  readonly id: string;
  readonly render: (width: number, ctx: BijouContext) => unknown;
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
  if (!isRecord(value)) {
    return false;
  }
  const categories = value.CATEGORIES;
  return Array.isArray(categories) && categories.every((category) => {
    if (!isRecord(category) || !('title' in category)) {
      return false;
    }
    return Array.isArray(category.entries);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object';
}

function findRegistryEntry(registry: ShowcaseRegistry, categoryTitle: string, entryId: string): ShowcaseEntry {
  const category = registry.CATEGORIES.find((candidate) => candidate.title === categoryTitle);
  if (category == null) {
    throw new Error(`showcase category not found: ${categoryTitle}`);
  }
  const entry = category.entries.find((candidate): candidate is ShowcaseEntry => {
    return candidate != null
      && typeof candidate === 'object'
      && 'id' in candidate
      && candidate.id === entryId
      && 'render' in candidate
      && typeof candidate.render === 'function';
  });
  if (entry == null) {
    throw new Error(`showcase entry not found: ${entryId}`);
  }
  return entry;
}
