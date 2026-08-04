import type { BijouContext } from '@flyingrobots/bijou';
import { createKeyMap, type FrameLayoutNode, type FramePage } from '@flyingrobots/bijou-tui';
import { feedbackPanel, structurePanel } from './panel-components.js';
import { contrastPanel } from './panel-contrast.js';
import { swatchPanel } from './panel-swatches.js';

/** The lab holds no state of its own; the active theme lives in the frame. */
export interface LabModel {
  readonly placeholder: true;
}

/** The lab has no page-scoped messages. */
export interface LabMsg {
  readonly type: 'noop';
}

/** Accessor for the live context, re-read on every render. */
export type ContextAccessor = () => BijouContext;

function twoColumn(gridId: string, left: FrameLayoutNode, right: FrameLayoutNode): FrameLayoutNode {
  return {
    kind: 'grid',
    gridId,
    columns: ['1fr', '1fr'],
    rows: ['1fr'],
    areas: ['left right'],
    gap: 1,
    cells: { left, right },
  };
}

function page(
  id: string,
  title: string,
  layout: FramePage<LabModel, LabMsg>['layout'],
): FramePage<LabModel, LabMsg> {
  return {
    id,
    title,
    init: () => [{ placeholder: true }, []],
    update: (_msg, model) => [model, []],
    keyMap: createKeyMap<LabMsg>(),
    layout,
  };
}

/**
 * Build the three lab pages.
 *
 * Every pane reads the context through `getCtx` at render time rather than
 * capturing it, so a shell-theme change repaints the whole lab without any
 * page-level state to keep in sync.
 */
export function createLabPages(getCtx: ContextAccessor): readonly FramePage<LabModel, LabMsg>[] {
  const swatches = page('swatches', 'Swatches', () => twoColumn(
    'swatch-grid',
    {
      kind: 'pane',
      paneId: 'swatch-a',
      render: (width, height) => {
        const ctx = getCtx();
        return swatchPanel(ctx, ctx.theme.theme, ['surface', 'semantic', 'status'], width, height);
      },
    },
    {
      kind: 'pane',
      paneId: 'swatch-b',
      render: (width, height) => {
        const ctx = getCtx();
        return swatchPanel(ctx, ctx.theme.theme, ['border', 'ui'], width, height);
      },
    },
  ));

  const components = page('components', 'Components', () => twoColumn(
    'component-grid',
    {
      kind: 'pane',
      paneId: 'feedback',
      render: (width, height) => feedbackPanel(getCtx(), width, height),
    },
    {
      kind: 'pane',
      paneId: 'structure',
      render: (width, height) => structurePanel(getCtx(), width, height),
    },
  ));

  const contrast = page('contrast', 'Contrast', () => ({
    kind: 'pane',
    paneId: 'contrast',
    render: (width, height) => {
      const ctx = getCtx();
      return contrastPanel(ctx, ctx.theme.theme, width, height);
    },
  }));

  return [swatches, components, contrast];
}
