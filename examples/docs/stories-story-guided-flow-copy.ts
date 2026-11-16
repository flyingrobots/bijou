import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodText } from './story-preview-style.js';

/** Resolves every guidedFlow story string through the DOGFOOD catalog, falling back to English. */
export function guidedFlowCopy(localization: LocalizationPort | undefined) {
  return {
    summary: dogfoodText(localization, 'stories.guidedFlow.summary', 'Reusable block for calmer multi-step assistance surfaces with explicit sections and one obvious next action.'),
    useWhen1: dogfoodText(localization, 'stories.guidedFlow.useWhen1', 'The flow needs one calm recommendation or setup path without becoming a full wizard.'),
    useWhen2: dogfoodText(localization, 'stories.guidedFlow.useWhen2', 'Section rhythm and the next action should stay explicit instead of dissolving into generic prose.'),
    useWhen3: dogfoodText(localization, 'stories.guidedFlow.useWhen3', 'The surface is guided assistance, but not specifically AI explainability.'),
    avoidWhen1: dogfoodText(localization, 'stories.guidedFlow.avoidWhen1', 'The content is AI-mediated and needs explicit provenance, evidence, or confidence; prefer `explainability()`.'),
    avoidWhen2: dogfoodText(localization, 'stories.guidedFlow.avoidWhen2', 'The user needs editable state transitions or full step-by-step routing owned by the shell.'),
    avoidWhen3: dogfoodText(localization, 'stories.guidedFlow.avoidWhen3', 'A simple note or alert would already say the whole thing honestly.'),
    'lowering.interactive': dogfoodText(localization, 'stories.guidedFlow.lowering.interactive', 'One grouped block keeps summary, steps, sections, and next action visibly distinct.'),
    'lowering.static': dogfoodText(localization, 'stories.guidedFlow.lowering.static', 'The same section rhythm stays deterministic without runtime shell behavior.'),
    'lowering.pipe': dogfoodText(localization, 'stories.guidedFlow.lowering.pipe', 'Indented sections and a labeled next action preserve the path without decorative chrome.'),
    'lowering.accessible': dogfoodText(localization, 'stories.guidedFlow.lowering.accessible', 'Linearized steps and section labels preserve the same guided meaning in reading order.'),
    'variant.stagingRollout.label': dogfoodText(localization, 'stories.guidedFlow.variant.stagingRollout.label', 'Staging rollout'),
    'variant.stagingRollout.description': dogfoodText(localization, 'stories.guidedFlow.variant.stagingRollout.description', 'Calm multi-step guidance with one explicit next action.'),
    'preview.title': dogfoodText(localization, 'stories.guidedFlow.preview.title', 'Prepare the staging rollout'),
    'preview.label': dogfoodText(localization, 'stories.guidedFlow.preview.label', 'Setup'),
    'preview.summary': dogfoodText(localization, 'stories.guidedFlow.preview.summary', 'Keep the operator on one calm path instead of scattering the sequence across notes, drawers, and status rows.'),
    'preview.meta.owner': dogfoodText(localization, 'stories.guidedFlow.preview.meta.owner', 'Owner: Platform ops'),
    'preview.meta.window': dogfoodText(localization, 'stories.guidedFlow.preview.meta.window', 'Window: Today'),
    'preview.step1.title': dogfoodText(localization, 'stories.guidedFlow.preview.step1.title', 'Review rollout health'),
    'preview.step1.detail': dogfoodText(localization, 'stories.guidedFlow.preview.step1.detail', 'Canary latency and error budget are both healthy.'),
    'preview.step2.title': dogfoodText(localization, 'stories.guidedFlow.preview.step2.title', 'Refresh the staging secret'),
    'preview.step2.detail': dogfoodText(localization, 'stories.guidedFlow.preview.step2.detail', 'The existing token expires in 30 minutes.'),
    'preview.step3.title': dogfoodText(localization, 'stories.guidedFlow.preview.step3.title', 'Promote the rollout'),
    'preview.step3.detail': dogfoodText(localization, 'stories.guidedFlow.preview.step3.detail', 'Only after the new secret is confirmed.'),
    'preview.section.why.title': dogfoodText(localization, 'stories.guidedFlow.preview.section.why.title', 'Why'),
    'preview.section.why.content': dogfoodText(localization, 'stories.guidedFlow.preview.section.why.content', 'The rollout is healthy, but the expiring token makes the current path fragile until rotation is complete.'),
    'preview.section.note.title': dogfoodText(localization, 'stories.guidedFlow.preview.section.note.title', 'Operator note'),
    'preview.section.note.content': dogfoodText(localization, 'stories.guidedFlow.preview.section.note.content', 'Keep the guidance advisory until the rotated secret is confirmed in the deployment logs.'),
    'preview.nextAction': dogfoodText(localization, 'stories.guidedFlow.preview.nextAction', 'Open the staging secret manager and rotate the deployment token.'),
  } as const;
}
