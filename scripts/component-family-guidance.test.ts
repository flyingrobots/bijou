import { describe, expect, it } from 'vitest';
import { createTestContext } from '../packages/bijou/src/adapters/test/index.js';
import type { Surface } from '../packages/bijou/src/index.js';
import { createRuntimeLocalizationPort } from '../packages/bijou-i18n/src/index.js';
import { docsSurface } from '../examples/components/library-docs.js';
import { renderStoryPane } from '../examples/docs/app-story-pane.js';
import { createInitialComponentsExplorerModel } from '../examples/docs/app-explorer-init.js';
import { createDocsI18nRuntime } from '../examples/docs/app-i18n-runtime.js';
import { resolveDocsVisualThemeByShellThemeId } from '../examples/docs/app-theme-state.js';
import { STORY_GUIDED_FLOW } from '../examples/docs/stories-story-guided-flow.js';
import { STORY_BADGE } from '../examples/docs/stories-story-badge.js';

function surfaceText(surface: Surface): string {
  return Array.from({ length: surface.height }, (_, y) =>
    Array.from({ length: surface.width }, (_, x) => surface.get(x, y).char).join(''),
  ).join('\n').replace(/\s+/g, ' ');
}

describe('canonical family guidance on component documentation surfaces', () => {
  it.each([
    {
      story: STORY_GUIDED_FLOW,
      guidance: 'title the flow with the outcome the user is working toward',
    },
    {
      story: STORY_BADGE,
      guidance: 'keep badge labels terse, stable, and noun-like or state-like',
    },
  ])('renders guidance and ownership for $story.title in both apps', ({ story, guidance }) => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 50 } });
    const model = createInitialComponentsExplorerModel(ctx, 'en', story.id);
    const localization = createRuntimeLocalizationPort(createDocsI18nRuntime());
    const dogfood = renderStoryPane(model, 150, ctx, resolveDocsVisualThemeByShellThemeId(undefined), localization);
    const library = docsSurface(story, 0, 150, ctx);
    for (const surface of [library, dogfood]) {
      const text = surfaceText(surface);
      expect(text).toContain('Content guidance');
      expect(text).toContain(guidance);
      expect(text).toContain('Ownership');
      expect(text).toMatch(/Ownership\s+(?:[-•]\s+)?core/);
      expect(text).toContain(story.docs.summary);
      expect(text).toContain(story.docs.useWhen[0]);
    }
  });
});
