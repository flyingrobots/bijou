import { describe, expect, it } from 'vitest';
import {
  appShellBlock,
  inspectorPanelBlock,
  lintModeLowering,
  readerSurfaceBlock,
  standardBlocks,
} from '../../../packages/bijou/src/index.js';

describe('DX-031E rendered standard block proof', () => {
  it('renders the shipped standard blocks as live outputs instead of placeholders', () => {
    const rendered = [
      appShellBlock.render({
        mode: 'pipe',
        slots: {
          navigation: 'Docs nav',
          content: 'Blocks guide',
          inspector: 'ReaderSurface details',
          status: 'Ready',
        },
      }).output,
      readerSurfaceBlock.render({
        mode: 'pipe',
        slots: {
          content: 'Readable block documentation.',
          outline: ['Intro', 'Lowering'],
        },
      }).output,
      inspectorPanelBlock.render({
        mode: 'pipe',
        slots: {
          selection: 'ReaderSurface',
          details: ['schema-aware', 'command-aware'],
        },
      }).output,
    ].join('\n\n');

    expect(rendered).toContain('AppShell');
    expect(rendered).toContain('ReaderSurface');
    expect(rendered).toContain('InspectorPanel');
    expect(rendered).toContain('navigation: Docs nav');
    expect(rendered).toContain('content: Blocks guide');
    expect(rendered).toContain('content: Readable block documentation.');
    expect(rendered).toContain('selection: ReaderSurface');
    expect(rendered).not.toContain('definition placeholder');
  });

  it('keeps rendered block lowering facts stable across modes', () => {
    const modes = ['interactive', 'static', 'pipe', 'accessible'] as const;

    for (const block of standardBlocks) {
      const report = lintModeLowering({
        modes: modes.map((mode) => ({
          mode,
          facts: block.render({
            mode,
            slots: renderSlotsFor(block.metadata.blockName),
          }).facts ?? [],
        })),
      });

      expect(report).toMatchObject({ passed: true });
    }
  });

  it('does not expose provider, subscription, refresh, render-tree traversal, or dispatch handles', () => {
    for (const block of standardBlocks) {
      const rendered = block.render({
        mode: 'pipe',
        slots: renderSlotsFor(block.metadata.blockName),
      });

      expect('provider' in rendered).toBe(false);
      expect('subscribe' in rendered).toBe(false);
      expect('unsubscribe' in rendered).toBe(false);
      expect('refresh' in rendered).toBe(false);
      expect('dispatch' in rendered).toBe(false);
      expect('traverse' in rendered).toBe(false);
    }
  });
});

function renderSlotsFor(blockName: string): Readonly<Record<string, unknown>> {
  switch (blockName) {
    case 'AppShell':
      return {
        navigation: 'Docs nav',
        content: 'Blocks guide',
        inspector: 'Current selection',
        status: 'Ready',
        overlays: ['Help'],
      };
    case 'ReaderSurface':
      return {
        content: 'Readable block documentation.',
        navigation: 'Docs nav',
        outline: ['Intro', 'Lowering'],
      };
    case 'InspectorPanel':
      return {
        selection: 'ReaderSurface',
        details: ['schema-aware', 'command-aware'],
        actions: ['reveal source'],
      };
    case 'InlineStatusBlock':
      return { label: 'docs', status: 'ok', message: 'synced' };
    case 'InFlowStatusBlock':
      return { severity: 'warning', source: 'docs', message: 'inventory stale', action: 'run docs:inventory' };
    case 'TransientOverlayBlock':
      return { priority: 'normal', message: 'Saved DOGFOOD route', dismiss: 'Esc dismisses' };
    case 'ActivityStreamBlock':
      return { events: ['10:41 tests passed', '10:42 PR opened'], selected: '10:41 tests passed' };
    case 'ShortcutCueBlock':
      return { shortcuts: ['/ Search', '? Help', 'Esc Close'], scope: 'page' };
    case 'ProgressIndicatorBlock':
      return { label: 'Install packages', value: '3', total: '5', percent: '60%' };
    case 'FramedGroupBlock':
      return {
        title: 'Release Checks',
        items: ['tests green', 'docs updated', 'PR linked'],
        selected: 'tests green',
        mode: 'review',
      };
    case 'ExplainabilityWalkthroughBlock':
      return {
        title: 'Why this changed',
        steps: ['input changed', 'constraint tightened', 'preview re-rendered'],
        evidence: 'DF-040 playback',
        decision: 'keep grouped proof visible',
        nextStep: 'open lower-mode output',
      };
    case 'FormattedDocumentBlock':
      return {
        heading: 'Blocks document',
        body: 'Use prose for persistent product truth.',
        callout: 'Lower modes keep the same heading and body facts.',
        code: 'block: FormattedDocumentBlock',
      };
    case 'LinkDestinationBlock':
      return {
        label: 'DOGFOOD.md',
        destination: 'docs/DOGFOOD.md',
        kind: 'docs',
        status: 'available',
      };
    case 'DividerBlock':
      return {
        label: 'Release Evidence',
        style: 'rule',
        density: 'compact',
      };
    case 'TextEntryBlock':
      return {
        field: 'Search docs',
        value: 'table',
        placeholder: 'type a query',
        validation: '4 results',
        results: 4,
      };
    default:
      throw new Error(`unknown standard block ${blockName}`);
  }
}
