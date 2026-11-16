import { describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createRuntimeLocalizationPort } from '../packages/bijou-i18n/src/index.js';
import { applyDogfoodLocale } from '../examples/docs/app-localization.js';
import { createDocsI18nRuntime } from '../examples/docs/app-i18n-runtime.js';
import { localizeStory } from '../examples/docs/app-story-catalog.js';
import { STORY_GUIDED_FLOW, createGuidedFlowStory } from '../examples/docs/stories-story-guided-flow.js';
import { storyDocsMarkdown, storyPreviewSurface, type ComponentStory } from '../examples/_stories/protocol.js';

function renderPipe(story: ComponentStory): string {
  const ctx = createTestContext({ mode: 'pipe' });
  const variant = story.variants[0];
  if (variant === undefined) throw new Error('missing variant');
  const surface = storyPreviewSurface(variant.render({ width: 60, ctx, state: undefined, timeMs: 0 }));
  return Array.from({ length: surface.height }, (_row, y) =>
    Array.from({ length: surface.width }, (_col, x) => surface.get(x, y).char).join('').trimEnd(),
  ).join('\n');
}

async function localized(locale: string): Promise<ComponentStory> {
  const runtime = createDocsI18nRuntime();
  await applyDogfoodLocale(runtime, {}, locale);
  return createGuidedFlowStory(createRuntimeLocalizationPort(runtime));
}

describe('guidedFlow story localization', () => {
  it('renders the English golden when no localization is supplied or the locale is en', async () => {
    expect(renderPipe(STORY_GUIDED_FLOW)).toContain('Prepare the staging rollout');
    expect(renderPipe(await localized('en'))).toBe(renderPipe(STORY_GUIDED_FLOW));
  });

  it.each([
    ['fr', 'Préparer le déploiement en préproduction', 'Responsable : Platform ops'],
    ['es', 'Prepara el despliegue en staging', 'Responsable: Platform ops'],
    ['de', 'Das Staging-Rollout vorbereiten', 'Verantwortlich: Platform ops'],
  ])('translates preview and docs copy in %s', async (locale, title, owner) => {
    const story = await localized(locale);
    const output = renderPipe(story);
    expect(output).toContain(title);
    expect(output).toContain(owner);
    expect(output).not.toContain('Prepare the staging rollout');
    const preset = story.profilePresets[0];
    const variant = story.variants[0];
    if (preset === undefined || variant === undefined) throw new Error('missing');
    const docs = storyDocsMarkdown(story, variant, preset);
    expect(docs).not.toContain(STORY_GUIDED_FLOW.docs.summary);
    expect(docs).toContain('`explainability()`');
    expect(variant.label).not.toBe('Staging rollout');
  });

  it('exposes the pattern through localizeStory and leaves non-opt-in stories unchanged', async () => {
    const runtime = createDocsI18nRuntime();
    await applyDogfoodLocale(runtime, {}, 'es');
    expect(localizeStory(STORY_GUIDED_FLOW, createRuntimeLocalizationPort(runtime)).docs.summary).toContain('Bloque reutilizable');
    const { localize, ...plain } = STORY_GUIDED_FLOW;
    expect(localize).toBeTypeOf('function');
    expect(localizeStory(plain, createRuntimeLocalizationPort(runtime))).toBe(plain);
  });

  it('falls back to English for a locale without catalog rows', async () => {
    const runtime = createDocsI18nRuntime();
    await applyDogfoodLocale(runtime, {}, 'it');
    expect(renderPipe(createGuidedFlowStory(createRuntimeLocalizationPort(runtime)))).toBe(renderPipe(STORY_GUIDED_FLOW));
  });
});
