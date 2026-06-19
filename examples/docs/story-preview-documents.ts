import { dogfoodText } from './story-preview-style.js';

export const LONG_DOCUMENT = [
  dogfoodText(undefined, 'stories.document.buildPlan.title', 'Build plan'),
  '',
  dogfoodText(undefined, 'stories.document.buildPlan.step.resolveDependencies', '1. Resolve dependencies'),
  dogfoodText(undefined, 'stories.document.buildPlan.step.runMigrations', '2. Run migrations'),
  dogfoodText(undefined, 'stories.document.buildPlan.step.bakeArtifacts', '3. Bake artifacts'),
  dogfoodText(undefined, 'stories.document.buildPlan.step.rollCanaries', '4. Roll canaries'),
  dogfoodText(undefined, 'stories.document.buildPlan.step.promoteRelease', '5. Promote release'),
  '',
  dogfoodText(
    undefined,
    'stories.document.buildPlan.frameReplay',
    'Each stage emits its own frame and can be replayed later.',
  ),
  '',
  dogfoodText(
    undefined,
    'stories.document.viewport.widthSensitive',
    'The viewport story is intentionally width-sensitive so the docs app can',
  ),
  dogfoodText(
    undefined,
    'stories.document.viewport.proveClipping',
    'prove clipping, masking, and scroll-state behavior without a separate demo.',
  ),
].join('\n');

export const MARKDOWN_RELEASE_NOTES = [
  dogfoodText(undefined, 'stories.markdown.releaseNote.title', '# Release note'),
  '',
  dogfoodText(
    undefined,
    'stories.markdown.releaseNote.intro',
    '**Bijou** keeps docs, shell, and examples inside the same runtime.',
  ),
  '',
  dogfoodText(undefined, 'stories.markdown.releaseNote.sliceHeading', '## This slice'),
  '',
  dogfoodText(
    undefined,
    'stories.markdown.releaseNote.item.boundedProse',
    '- documents bounded prose honestly',
  ),
  dogfoodText(
    undefined,
    'stories.markdown.releaseNote.item.explicitLinks',
    '- keeps links explicit instead of vague',
  ),
  dogfoodText(
    undefined,
    'stories.markdown.releaseNote.item.noLayoutChrome',
    '- avoids turning markdown into layout chrome',
  ),
  '',
  dogfoodText(
    undefined,
    'stories.markdown.releaseNote.quote',
    '> Move to pager patterns if the content becomes a document-reading task.',
  ),
].join('\n');
