import { V8_DOGFOOD_RELEASE_TITLE } from './release-title-v8.js';
import type { OutputMode } from '@flyingrobots/bijou';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText as dogfoodText } from './localization.js';

export interface DogfoodReleaseTitleProofLane {
  readonly id: string;
  readonly label: string;
  readonly localizationKey: string;
}
export interface DogfoodReleaseTitle {
  readonly id: string;
  readonly title: string;
  readonly titleKey: string;
  readonly summary: string;
  readonly summaryKey: string;
  readonly subtitle: string;
  readonly subtitleKey: string;
  readonly gate: string;
  readonly gateKey: string;
  readonly navigation: readonly string[];
  readonly navigationKey: string;
  readonly motif?: string;
  readonly motifKey?: string;
  readonly proofLanes: readonly DogfoodReleaseTitleProofLane[];
}
export interface DogfoodReleaseTitleFact {
  readonly key: string;
  readonly value: string;
}
export interface RenderDogfoodReleaseTitleTextOptions {
  readonly release?: DogfoodReleaseTitle;
  readonly mode: OutputMode;
  readonly width: number;
  readonly localization?: LocalizationPort;
}
export const V7_DOGFOOD_RELEASE_TITLE: DogfoodReleaseTitle = Object.freeze({
  id: 'v7',
  title: dogfoodText(undefined, 'release.title.v7.title', 'V7 Product Truth'),
  titleKey: 'release.title.v7.title',
  summary: dogfoodText(undefined, 'release.title.v7.summary', 'Release identity, current proof lanes, and lower-mode release facts for DOGFOOD.'),
  summaryKey: 'release.title.v7.summary',
  subtitle: dogfoodText(undefined, 'release.title.v7.subtitle', 'Blocks prove product surfaces. DOGFOOD proves Blocks.'),
  subtitleKey: 'release.title.v7.subtitle',
  gate: dogfoodText(undefined, 'release.title.v7.gate', 'v6 issue-complete, v7 closeout in flight'),
  gateKey: 'release.title.v7.gate',
  navigation: dogfoodText(undefined, 'release.title.v7.navigation', 'Docs | Blocks | BlockLab | Release Notes').split(' | '),
  navigationKey: 'release.title.v7.navigation',
  proofLanes: Object.freeze([
    {
      id: 'table-parity',
      label: dogfoodText(undefined, 'release.title.v7.proofLane.tableParity', 'table parity'),
      localizationKey: 'release.title.v7.proofLane.tableParity',
    },
    {
      id: 'scoped-node-io',
      label: dogfoodText(undefined, 'release.title.v7.proofLane.scopedNodeIo', 'scoped Node I/O'),
      localizationKey: 'release.title.v7.proofLane.scopedNodeIo',
    },
    {
      id: 'blocklab',
      label: dogfoodText(undefined, 'release.title.v7.proofLane.blocklab', 'BlockLab'),
      localizationKey: 'release.title.v7.proofLane.blocklab',
    },
    {
      id: 'release-title',
      label: dogfoodText(undefined, 'release.title.v7.proofLane.releaseTitle', 'release title'),
      localizationKey: 'release.title.v7.proofLane.releaseTitle',
    },
  ]),
});
export const V7_LAUNCH_DOGFOOD_RELEASE_TITLE: DogfoodReleaseTitle =
  Object.freeze({
    id: 'v7-launch',
    title: dogfoodText(
      undefined,
      'release.title.v7Launch.title',
      'V7 Launch Wake',
    ),
    titleKey: 'release.title.v7Launch.title',
    summary: dogfoodText(undefined, 'release.title.v7Launch.summary', 'Post-release title treatment, visible release proof, and lower-mode facts for DOGFOOD.'),
    summaryKey: 'release.title.v7Launch.summary',
    subtitle: dogfoodText(undefined, 'release.title.v7Launch.subtitle', 'A released line leaves a readable trail.'),
    subtitleKey: 'release.title.v7Launch.subtitle',
    gate: dogfoodText(undefined, 'release.title.v7Launch.gate', 'v7.0.0 released, patch lane open'),
    gateKey: 'release.title.v7Launch.gate',
    navigation: dogfoodText(undefined, 'release.title.v7Launch.navigation', 'Release Notes | Migration | DOGFOOD | BlockLab').split(' | '),
    navigationKey: 'release.title.v7Launch.navigation',
    motif: dogfoodText(undefined, 'release.title.v7Launch.motif', 'Wake lines, not fireworks: proof remains visible after ship.'),
    motifKey: 'release.title.v7Launch.motif',
    proofLanes: Object.freeze([
      {
        id: 'published-release',
        label: dogfoodText(undefined, 'release.title.v7Launch.proofLane.publishedRelease', 'published release'),
        localizationKey: 'release.title.v7Launch.proofLane.publishedRelease',
      },
      {
        id: 'follow-up-patch',
        label: dogfoodText(undefined, 'release.title.v7Launch.proofLane.followUpPatch', 'follow-up patch'),
        localizationKey: 'release.title.v7Launch.proofLane.followUpPatch',
      },
      {
        id: 'title-gallery',
        label: dogfoodText(undefined, 'release.title.v7Launch.proofLane.titleGallery', 'title gallery'),
        localizationKey: 'release.title.v7Launch.proofLane.titleGallery',
      },
      {
        id: 'main-ci',
        label: dogfoodText(undefined, 'release.title.v7Launch.proofLane.mainCi', 'green main CI'),
        localizationKey: 'release.title.v7Launch.proofLane.mainCi',
      },
    ]),
  });
export const DOGFOOD_RELEASE_TITLE_GALLERY: readonly DogfoodReleaseTitle[] =
  Object.freeze([V8_DOGFOOD_RELEASE_TITLE, V7_LAUNCH_DOGFOOD_RELEASE_TITLE, V7_DOGFOOD_RELEASE_TITLE]);
export const CURRENT_DOGFOOD_RELEASE_TITLE = V8_DOGFOOD_RELEASE_TITLE;
export function dogfoodReleaseTitleFacts(
  release: DogfoodReleaseTitle = CURRENT_DOGFOOD_RELEASE_TITLE,
): readonly DogfoodReleaseTitleFact[] {
  return Object.freeze([
    { key: 'release_id', value: release.id },
    { key: 'release_title', value: release.title },
    ...(release.motif == null
      ? []
      : [{ key: 'release_motif', value: release.motif }]),
    ...release.proofLanes.map((lane) => ({
      key: 'proof_lane',
      value: lane.label,
    })),
    { key: 'navigation_available', value: 'true' },
  ]);
}
