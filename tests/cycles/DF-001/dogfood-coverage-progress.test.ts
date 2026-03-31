import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../../packages/bijou/src/adapters/test/index.js';
import { runScript } from '../../../packages/bijou-tui/src/driver.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function frameText(frame: { width: number; height: number; get(x: number, y: number): { char?: string } }) {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char || ' ';
    }
    text += '\n';
  }
  return text;
}

describe('DF-001 DOGFOOD coverage progress cycle', () => {
  it('creates an active cycle doc with the required workflow sections', () => {
    const cycle = read('/Users/james/git/bijou/docs/design/DF-001-show-dogfood-coverage-progress.md');

    expect(cycle).toContain('## Human playback');
    expect(cycle).toContain('## Agent playback');
    expect(cycle).toContain('## Linked invariants');
    expect(cycle).toContain('## Implementation outline');
    expect(cycle).toContain('## Retrospective');
  });

  it('resolves coverage from the canonical family reference instead of a hardcoded ratio', () => {
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    expect(coverage.totalFamilies).toBeGreaterThanOrEqual(coverage.documentedFamilies);
    expect(coverage.totalFamilies).toBeGreaterThan(0);
    expect(coverage.documentedFamilies).toBeGreaterThan(0);
    expect(coverage.referenceFamilies.some((family) => family.label === 'In-flow status block')).toBe(true);
    expect(coverage.referenceFamilies.some((family) => family.label === 'Overlay primitives')).toBe(true);
  });

  it('shows the coverage ratio and percentage in the initial DOGFOOD docs content pane', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    const entered = await runScript(app, [{ key: '\r' }], { ctx });
    const text = frameText(entered.frames[entered.frames.length - 1]!);

    expect(text).toContain('Documentation coverage');
    expect(text).toContain(`${coverage.documentedFamilies}/${coverage.totalFamilies}`);
    expect(text).toContain(`${coverage.percent}%`);
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(existsSync('/Users/james/git/bijou/docs/BACKLOG/DF-002-expand-dogfood-component-family-coverage.md')).toBe(true);
  });
});
