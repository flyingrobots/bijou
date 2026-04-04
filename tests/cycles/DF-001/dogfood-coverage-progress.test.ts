import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../../packages/bijou/src/adapters/test/index.js';
import { runScript } from '../../../packages/bijou-tui/src/driver.js';
import { createDocsApp } from '../../../examples/docs/app.js';
import { resolveDogfoodDocsCoverage } from '../../../examples/docs/coverage.js';
import { COMPONENT_STORIES } from '../../../examples/docs/stories.js';
import { existsRepoPath, readRepoFile } from '../repo.js';


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
    const cycle = readRepoFile('docs/design/DF-001-show-dogfood-coverage-progress.md');

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

  it('shows the coverage ratio and percentage in the Components section once DOGFOOD switches there', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);
    const coverage = resolveDogfoodDocsCoverage(COMPONENT_STORIES);

    const entered = await runScript(app, [{ key: '\r' }, { key: ']' }], { ctx });
    const text = frameText(entered.frames[entered.frames.length - 1]!);

    expect(text).toContain('Documentation coverage');
    expect(text).toContain(`${coverage.documentedFamilies}/${coverage.totalFamilies}`);
    expect(text).toContain(`${coverage.percent}%`);
  });

  it('shows the DOGFOOD banner and expansion on the landing screen at a normal viewport size', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const landing = await runScript(app, [], { ctx });
    const initialFrame = landing.frames[landing.frames.length - 1]!;
    const text = frameText(initialFrame);
    const expansion = 'Documentation Of Good Foundational Onboarding and Discovery';
    const prompt = 'Press [Enter]';
    const lines = text.split('\n');
    const expansionRow = lines.findIndex((lineText) => lineText.includes(expansion));
    const expansionLine = expansionRow >= 0 ? lines[expansionRow] : undefined;

    expect(text).toContain('DOGFOOD');
    expect(text).toContain(expansion);
    expect(text).toContain(prompt);
    expect(expansionLine).toBeDefined();

    const contentStart = expansionLine!.indexOf(expansion);
    const leftBorder = expansionLine!.lastIndexOf('│', contentStart);
    const rightBorder = expansionLine!.indexOf('│', contentStart + expansion.length);
    expect(leftBorder).toBeGreaterThanOrEqual(0);
    expect(rightBorder).toBeGreaterThan(contentStart + expansion.length);

    const leftPadding = contentStart - leftBorder - 1;
    const rightPadding = rightBorder - contentStart - expansion.length;
    expect(Math.abs(leftPadding - rightPadding)).toBeLessThanOrEqual(2);

    const promptRow = lines.findIndex((lineText) => lineText.includes(prompt));
    expect(promptRow).toBeGreaterThan(expansionRow);
    expect(promptRow - expansionRow).toBeGreaterThanOrEqual(3);

    const promptStart = lines[promptRow]!.indexOf(prompt);
    const enterCellBefore = initialFrame.get(promptStart + 'Press ['.length, promptRow);
    expect(enterCellBefore.char).toBe('E');
    expect(enterCellBefore.fg).toBeDefined();

    const pulsed = await runScript(app, [{ pulse: { dt: 0.6 } }], { ctx });
    const pulsedFrame = pulsed.frames[pulsed.frames.length - 1]!;
    const enterCellAfter = pulsedFrame.get(promptStart + 'Press ['.length, promptRow);
    expect(enterCellAfter.char).toBe('E');
    expect(enterCellAfter.fg).toBeDefined();
    expect(enterCellAfter.fg).not.toBe(enterCellBefore.fg);
  });

  it('spawns the next DOGFOOD backlog item', () => {
    expect(existsRepoPath('docs/BACKLOG/DF-002-expand-dogfood-component-family-coverage.md')).toBe(true);
  });
});
