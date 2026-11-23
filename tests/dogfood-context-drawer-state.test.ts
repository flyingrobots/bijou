import { describe, expect, it } from 'vitest';
import { createRuntimeLocalizationPort } from '../packages/bijou-i18n/src/index.js';
import { createTestContext } from '../packages/bijou/src/adapters/test/index.js';
import type { FrameLayoutNode } from '../packages/bijou-tui/src/index.js';
import {
  CONTEXT_DRAWER_PANE_ID,
  createContextDrawerState,
  docsShellPaneIds,
  resolveContextDrawerRestorePane,
} from '../examples/docs/app-context-drawer.js';
import { createComponentsPageLayout } from '../examples/docs/app-components-layout.js';
import { createInitialComponentsExplorerModel } from '../examples/docs/app-explorer-init.js';
import { createGuidePageLayout } from '../examples/docs/app-guide-layout.js';
import { createDocsI18nRuntime } from '../examples/docs/app-i18n-runtime.js';
import type { DocsLayoutVariant } from '../examples/docs/app-ids.js';
import { resolveDocsVisualThemeByShellThemeId } from '../examples/docs/app-theme-state.js';

const VARIANTS: readonly DocsLayoutVariant[] = ['wide', 'standard', 'narrow', 'tiny'];

function paneIds(node: FrameLayoutNode): string[] {
  if (node.kind === 'pane') return [node.paneId];
  if (node.kind === 'split') return [...paneIds(node.paneA), ...paneIds(node.paneB)];
  return Object.values(node.cells).flatMap((cell) => paneIds(cell));
}

describe('DOGFOOD contextual drawer state', () => {
  it('is closed by default and keyed by the page', () => {
    expect(createContextDrawerState('components')).toEqual({
      open: false,
      kind: 'story-variants',
      restorePaneId: 'story-content',
    });
    expect(createContextDrawerState('guides')).toEqual({
      open: false,
      kind: 'guide-meta',
      restorePaneId: 'guide-content',
    });
  });

  it('lists the visible panes for every layout variant, open and closed', () => {
    expect(docsShellPaneIds('components', 'wide', false)).toEqual(['family-nav', 'story-content', 'story-variants']);
    expect(docsShellPaneIds('components', 'wide', true)).toEqual(['family-nav', 'story-content', CONTEXT_DRAWER_PANE_ID]);
    expect(docsShellPaneIds('guides', 'standard', false)).toEqual(['guide-nav', 'guide-content']);
    expect(docsShellPaneIds('guides', 'standard', true)).toEqual([CONTEXT_DRAWER_PANE_ID, 'guide-content']);
    expect(docsShellPaneIds('components', 'narrow', true)).toEqual([CONTEXT_DRAWER_PANE_ID, 'story-content']);
    expect(docsShellPaneIds('components', 'tiny', false)).toEqual(['story-content']);
    expect(docsShellPaneIds('components', 'tiny', true)).toEqual([CONTEXT_DRAWER_PANE_ID]);
  });

  it('renders the drawer as a layout pane that matches the visible-pane rule', () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 40 } });
    const localization = createRuntimeLocalizationPort(createDocsI18nRuntime());
    const theme = resolveDocsVisualThemeByShellThemeId(undefined);
    const base = createInitialComponentsExplorerModel(ctx, 'en');
    for (const layoutVariant of VARIANTS) {
      for (const open of [false, true]) {
        const model = {
          ...base,
          layoutVariant,
          contextDrawer: { ...createContextDrawerState('components'), open },
        };
        const components = createComponentsPageLayout(model, theme, () => ctx, localization);
        const guides = createGuidePageLayout('guides', {
          ...model,
          contextDrawer: { ...createContextDrawerState('guides'), open },
        }, theme, () => ctx, localization);
        expect(paneIds(components).sort()).toEqual([...docsShellPaneIds('components', layoutVariant, open)].sort());
        expect(paneIds(guides).sort()).toEqual([...docsShellPaneIds('guides', layoutVariant, open)].sort());
      }
    }
  });

  it('restores to the captured pane only when it is visible', () => {
    expect(resolveContextDrawerRestorePane('components', 'family-nav', ['family-nav', 'story-content'])).toBe('family-nav');
    expect(resolveContextDrawerRestorePane('components', 'family-nav', ['story-content'])).toBe('story-content');
    expect(resolveContextDrawerRestorePane('guides', 'guide-meta', ['guide-nav', 'guide-content'])).toBe('guide-content');
    expect(resolveContextDrawerRestorePane('guides', CONTEXT_DRAWER_PANE_ID, ['guide-content'])).toBe('guide-content');
  });
});
