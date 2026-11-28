import { describe, dividerBlock, expect, it, standardBlocks } from './standard-blocks.test-support.js';
import { renderStandardSectionBlock } from './standard-blocks/render.js';
import type { StandardBlockName } from './standard-blocks.js';
import { drawnFrame, framedSlotTitles } from './standard-blocks-drawn.test-support.js';

// Every standard block, so the check is calibrated against the generic framed rendering of each one.
const STANDARD_BLOCK_NAMES = [
  'AppShell', 'ReaderSurface', 'InspectorPanel', 'InlineStatusBlock', 'InFlowStatusBlock',
  'TransientOverlayBlock', 'ActivityStreamBlock', 'ShortcutCueBlock', 'ProgressIndicatorBlock',
  'FramedGroupBlock', 'ExplainabilityWalkthroughBlock', 'FormattedDocumentBlock', 'LinkDestinationBlock',
  'DividerBlock', 'TextEntryBlock', 'SingleChoiceBlock', 'MultipleChoiceBlock', 'BinaryDecisionBlock',
  'PeerNavigationBlock', 'ProgressiveDisclosureBlock', 'PathProgressBlock', 'BrandEmphasisBlock',
  'ModeAwarePrimitiveBlock', 'DenseComparisonBlock', 'HierarchyBlock', 'ExplorationListBlock',
  'TemporalDependencyBlock',
] as const satisfies readonly StandardBlockName[];

function titleCase(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

describe('framedSlotTitles calibration (flyingrobots/bijou#935)', () => {
  it('covers every block in the standard catalog', () => {
    expect(standardBlocks.map((block) => block.metadata.blockName)).toEqual([...STANDARD_BLOCK_NAMES]);
  });

  it('flags the generic framed rendering of every standard block, labelled or not', () => {
    const missed: string[] = [];
    STANDARD_BLOCK_NAMES.forEach((name, index) => {
      const block = standardBlocks[index];
      if (block === undefined) throw new Error(`no catalog block at ${String(index)}`);
      // The generic renderer titles each box with the slot label, or the capitalised id when a
      // slot has no label (as AppShell, ReaderSurface and InspectorPanel do today).
      const sections = block.metadata.slots.map((slot) => ({
        id: slot.id,
        label: slot.label ?? titleCase(slot.id),
        required: slot.required ?? false,
      }));
      const slots = Object.fromEntries(block.metadata.slots.map((slot) => [slot.id, 'value']));
      const frame = drawnFrame(renderStandardSectionBlock({ mode: 'interactive', slots }, name, sections));
      if (framedSlotTitles(block, frame).length === 0) missed.push(name);
    });

    expect(missed).toEqual([]);
  });

  it('does not flag a drawn block whose own text looks like a slot title', () => {
    const frame = drawnFrame(dividerBlock.render({ mode: 'interactive', slots: { label: 'Style' }, config: { width: 40 } }));

    expect(frame.rows[0]).toContain('─ Style ─');
    expect(framedSlotTitles(dividerBlock, frame)).toEqual([]);
  });

  it('needs the generic frame borders, not only the block name text (review: PR 943)', () => {
    const frame = drawnFrame(dividerBlock.render({
      mode: 'interactive',
      slots: { label: 'DividerBlock ─ Style' },
      config: { width: 60 },
    }));

    expect(frame.rows[0]).toContain('─ DividerBlock ─ Style ─');
    expect(framedSlotTitles(dividerBlock, frame)).toEqual([]);
  });
});
