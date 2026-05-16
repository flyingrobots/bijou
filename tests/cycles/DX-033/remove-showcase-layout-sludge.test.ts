import { describe, expect, it } from 'vitest';
import { readRepoFile } from '../repo.js';

describe('DX-033 remove showcase layout sludge', () => {
  it('keeps the active cycle doc tied to the playback contract', () => {
    const cycle = readRepoFile('docs/design/DX-033-remove-showcase-layout-sludge.md');

    expect(cycle).toContain('## Sponsored Users');
    expect(cycle).toContain('## Hills');
    expect(cycle).toContain('## Playback Questions');
    expect(cycle).toContain('## Requirements');
    expect(cycle).toContain('## Acceptance Criteria');
    expect(cycle).toContain('## Drift Check');
    expect(cycle).toContain('## Playback');
    expect(cycle).toContain('## Retrospective');
  });

  it('tightens the Node startApp convenience type away from any', () => {
    const source = readRepoFile('packages/bijou-node/src/index.ts');
    const test = readRepoFile('packages/bijou-node/src/index.test.ts');

    expect(source).toContain('export type StartAppOptions<M = unknown>');
    expect(source).not.toContain('export type StartAppOptions<M = any>');
    expect(test).toContain('defaults StartAppOptions message payloads to unknown instead of any');
    expect(test).toContain('expectTypeOf<StartAppOptions>().toEqualTypeOf<RunOptions<unknown> & NodeThemeOptions>()');
  });

  it('moves showcase sidebar clipping to the shared browsable-list surface', () => {
    const source = readRepoFile('examples/showcase/app.ts');

    expect(source).toContain('browsableListSurface');
    expect(source).toContain('showScrollbar: state.items.length > state.height');
    expect(source).toContain("const tierMark = (entry?.tier ?? 1) === 3 ? ' *' : ''");
    expect(source).not.toContain('items.slice(scrollY, scrollY + visibleCount)');
    expect(source).not.toContain('const visible = items.slice');
    expect(source).not.toContain('const visibleCount = model.listState.height');
    expect(source).not.toContain('width - 4');
  });

  it('records the secondary showcase posture in docs and the v6 lane', () => {
    const readme = readRepoFile('examples/showcase/README.md');
    const lane = readRepoFile('docs/method/backlog/v6.0.0/README.md');
    const legend = readRepoFile('docs/legends/DX-developer-experience.md');

    expect(readme).toContain('secondary example surface');
    expect(readme).toContain('npm run dogfood');
    expect(readme).toContain('npm run dogfood:storybook');
    expect(readme).toContain('browsableListSurface()');
    expect(lane).toContain('../../../design/DX-033-remove-showcase-layout-sludge.md');
    expect(legend).toContain('DX-033 — Remove showcase layout sludge');
  });
});
