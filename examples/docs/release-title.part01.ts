import type { OutputMode } from '@flyingrobots/bijou';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';

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
  title: 'V7 Product Truth',
  titleKey: 'release.title.v7.title',
  summary:
    'Release identity, current proof lanes, and lower-mode release facts for DOGFOOD.',
  summaryKey: 'release.title.v7.summary',
  subtitle: 'Blocks prove product surfaces. DOGFOOD proves Blocks.',
  subtitleKey: 'release.title.v7.subtitle',
  gate: 'v6 issue-complete, v7 closeout in flight',
  gateKey: 'release.title.v7.gate',
  navigation: ['Docs', 'Blocks', 'BlockLab', 'Release Notes'],
  navigationKey: 'release.title.v7.navigation',
  proofLanes: Object.freeze([
    {
      id: 'table-parity',
      label: 'table parity',
      localizationKey: 'release.title.v7.proofLane.tableParity',
    },
    {
      id: 'scoped-node-io',
      label: 'scoped Node I/O',
      localizationKey: 'release.title.v7.proofLane.scopedNodeIo',
    },
    {
      id: 'blocklab',
      label: 'BlockLab',
      localizationKey: 'release.title.v7.proofLane.blocklab',
    },
    {
      id: 'release-title',
      label: 'release title',
      localizationKey: 'release.title.v7.proofLane.releaseTitle',
    },
  ]),
});
export const V7_LAUNCH_DOGFOOD_RELEASE_TITLE: DogfoodReleaseTitle =
  Object.freeze({
    id: 'v7-launch',
    title: 'V7 Launch Wake',
    titleKey: 'release.title.v7Launch.title',
    summary:
      'Post-release title treatment, visible release proof, and lower-mode facts for DOGFOOD.',
    summaryKey: 'release.title.v7Launch.summary',
    subtitle: 'A released line leaves a readable trail.',
    subtitleKey: 'release.title.v7Launch.subtitle',
    gate: 'v7.0.0 released, patch lane open',
    gateKey: 'release.title.v7Launch.gate',
    navigation: ['Release Notes', 'Migration', 'DOGFOOD', 'BlockLab'],
    navigationKey: 'release.title.v7Launch.navigation',
    motif: 'Wake lines, not fireworks: proof remains visible after ship.',
    motifKey: 'release.title.v7Launch.motif',
    proofLanes: Object.freeze([
      {
        id: 'published-release',
        label: 'published release',
        localizationKey: 'release.title.v7Launch.proofLane.publishedRelease',
      },
      {
        id: 'follow-up-patch',
        label: 'follow-up patch',
        localizationKey: 'release.title.v7Launch.proofLane.followUpPatch',
      },
      {
        id: 'title-gallery',
        label: 'title gallery',
        localizationKey: 'release.title.v7Launch.proofLane.titleGallery',
      },
      {
        id: 'main-ci',
        label: 'green main CI',
        localizationKey: 'release.title.v7Launch.proofLane.mainCi',
      },
    ]),
  });
export const DOGFOOD_RELEASE_TITLE_GALLERY: readonly DogfoodReleaseTitle[] =
  Object.freeze([V7_LAUNCH_DOGFOOD_RELEASE_TITLE, V7_DOGFOOD_RELEASE_TITLE]);
export const CURRENT_DOGFOOD_RELEASE_TITLE = V7_LAUNCH_DOGFOOD_RELEASE_TITLE;
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
