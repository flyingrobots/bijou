import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('DX-034 declarative view data binding cycle', () => {
  it('defines the unidirectional immutable binding rule', () => {
    const cycle = readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');

    expect(cycle).toContain('## Core Rule');
    expect(cycle).toContain('Data binding in Bijou is:');
    expect(cycle).toContain('- unidirectional');
    expect(cycle).toContain('- declarative');
    expect(cycle).toContain('- immutable');
    expect(cycle).toContain('Views communicate user intent by emitting Commands.');
    expect(cycle).toContain('There is no reverse data mutation path from view to provider.');
  });

  it('separates providers, immutable snapshots, binding frames, and Commands', () => {
    const cycle = readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');

    expect(cycle).toContain('### Provider');
    expect(cycle).toContain('### Binding Snapshot');
    expect(cycle).toContain('### Command');
    expect(cycle).toContain('## Architecture');
    expect(cycle).toContain('Providers Normalize Every Backing Source');
    expect(cycle).toContain('Binding Frames Are Immutable');
    expect(cycle).toContain('User Input Emits Commands');
    expect(cycle).toContain('No import should register a global provider as a side effect.');
  });

  it('makes AppShell data binding and nested blocks explicit design scope', () => {
    const cycle = readRepoFile('docs/design/DX-034-declarative-view-data-binding.md');

    expect(cycle).toContain('## AppShell Implications');
    expect(cycle).toContain('named block slots can contain nested provider-bound blocks');
    expect(cycle).toContain('navigation, content, inspector, status');
    expect(cycle).toContain('region Commands bubble as user intent');
  });

  it('links DX-034 from the block cycle and release lane', () => {
    const dx031 = readRepoFile('docs/design/DX-031-standard-bijou-blocks.md');
    const legend = readRepoFile('docs/legends/DX-developer-experience.md');
    const v6Lane = readRepoFile('docs/method/backlog/v6.0.0/README.md');

    expect(dx031).toContain('## Relationship To DX-034');
    expect(dx031).toContain('Declarative View Data Binding');
    expect(dx031).toContain('provider-bound view data requirements');
    expect(legend).toContain('DX-034 — Declarative View Data Binding');
    expect(v6Lane).toContain('DX-034');
    expect(v6Lane).toContain('declarative view data binding');
  });
});
