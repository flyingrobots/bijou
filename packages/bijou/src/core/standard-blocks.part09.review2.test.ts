import { createTextSurface } from './components/surface-text.js';
import {
  blockRenderNode, describe, expect, findCell, inFlowStatusBlock, isSurfaceOutput, it, progressIndicatorBlock,
  renderBlockTree, shortcutCueBlock,
} from './standard-blocks.test-support.js';
import { comparableRows, drawStatus } from './standard-blocks-status.test-support.js';

const PROGRESS = { label: 'Install packages', value: '3', total: '5', percent: '60%' };

function joined(rows: readonly string[]): string {
  return rows.join('\n');
}

describe('status drawing second review (flyingrobots/bijou#936)', () => {
  it('R1: blits Surface value and total with their cells and rows unchanged', () => {
    const value = createTextSurface('Q1\nQ2', { fg: '#ff8800' });
    const total = createTextSurface('Z9', { fg: '#00aa55' });
    const result = renderBlockTree(blockRenderNode(progressIndicatorBlock, {
      mode: 'interactive',
      slots: { ...PROGRESS, value, total },
      config: { width: 60 },
    }));
    if (!isSurfaceOutput(result)) throw new Error('interactive output is not a Surface');
    const rows = drawStatus(progressIndicatorBlock, { ...PROGRESS, value, total }).rows;

    expect(findCell(result.output, 'Q')).toMatchObject({ char: 'Q', fg: value.get(0, 0).fg });
    expect(findCell(result.output, 'Z')).toMatchObject({ char: 'Z', fg: total.get(0, 0).fg });
    expect(rows.findIndex((row) => row.includes('Q1'))).toBeLessThan(rows.findIndex((row) => row.includes('Q2')));
  });

  it('shows the total when the value is absent', () => {
    const rows = drawStatus(progressIndicatorBlock, { label: 'Install packages', total: '57', percent: '60%' }).rows;

    expect(rows[0]).toMatch(/57\s*$/u);
  });

  it('keeps a non-numeric percent as text under an empty bar', () => {
    const rows = drawStatus(progressIndicatorBlock, { ...PROGRESS, percent: 'soon' }).rows;

    expect(rows[1]).toMatch(/^ {2}0% ⠐{55}$/u);
    expect(joined(rows.slice(2))).toContain('soon');
  });

  it('draws every field of a cue record besides its key', () => {
    const text = joined(drawStatus(shortcutCueBlock, { shortcuts: [{ key: 'g', action: 42, hint: 'go home' }] }).rows);

    expect(text).toContain('[ g ]');
    expect(['42', 'go', 'home'].filter((word) => !text.includes(word))).toEqual([]);
  });

  it('maps critical and failed severity to the error alert', () => {
    for (const severity of ['critical', 'failed', 'Error']) {
      const rows = comparableRows(drawStatus(inFlowStatusBlock, { severity, message: 'Disk check' }));
      expect(rows[1]?.startsWith('│✗ Disk check')).toBe(true);
    }
  });

  it('shows an unrecognised severity inside an info alert', () => {
    const rows = comparableRows(drawStatus(inFlowStatusBlock, { severity: 'urgentish', message: 'Disk check' }));

    expect(rows[1]?.startsWith('│ℹ Disk check')).toBe(true);
    expect(joined(rows)).toContain('urgentish');
  });
});
