import type { DogfoodReleaseTitle } from './release-title.part01.js';
import { dogfoodLocalizedText as dogfoodText } from './localization.js';

/** V8 identity describes this edition without claiming an unpublished stable release. */
export const V8_DOGFOOD_RELEASE_TITLE: DogfoodReleaseTitle = Object.freeze({
  id: 'v8',
  title: dogfoodText(undefined, 'release.title.v8.title', 'V8 / Jacquard 12'),
  titleKey: 'release.title.v8.title',
  summary: dogfoodText(undefined, 'release.title.v8.summary', 'A rolling Jacquard 12 title with readable release facts in every presentation.'),
  summaryKey: 'release.title.v8.summary',
  subtitle: dogfoodText(undefined, 'release.title.v8.subtitle', 'One application, every terminal.'),
  subtitleKey: 'release.title.v8.subtitle',
  gate: dogfoodText(undefined, 'release.title.v8.gate', 'V8 release closeout in progress'),
  gateKey: 'release.title.v8.gate',
  navigation: dogfoodText(undefined, 'release.title.v8.navigation', 'Docs | Blocks | BlockLab | Release Notes').split(' | '),
  navigationKey: 'release.title.v8.navigation',
  motif: dogfoodText(undefined, 'release.title.v8.motif', 'Jacquard 12 glyphs roll around a cylinder; meaning survives without animation.'),
  motifKey: 'release.title.v8.motif',
  proofLanes: Object.freeze([
    { id: 'offlineFont', label: dogfoodText(undefined, 'release.title.v8.proofLane.offlineFont', 'offline font geometry'), localizationKey: 'release.title.v8.proofLane.offlineFont' },
    { id: 'navigation', label: dogfoodText(undefined, 'release.title.v8.proofLane.navigation', 'keyboard navigation'), localizationKey: 'release.title.v8.proofLane.navigation' },
    { id: 'lowerModes', label: dogfoodText(undefined, 'release.title.v8.proofLane.lowerModes', 'readable lower modes'), localizationKey: 'release.title.v8.proofLane.lowerModes' },
  ]),
});
