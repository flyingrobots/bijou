import type { OutputMode } from '@flyingrobots/bijou';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText } from './localization.js';

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
  summary: 'Release identity, current proof lanes, and lower-mode release facts for DOGFOOD.',
  summaryKey: 'release.title.v7.summary',
  subtitle: 'Blocks prove product surfaces. DOGFOOD proves Blocks.',
  subtitleKey: 'release.title.v7.subtitle',
  gate: 'v6 issue-complete, v7 closeout in flight',
  gateKey: 'release.title.v7.gate',
  navigation: ['Docs', 'Blocks', 'BlockLab', 'Release Notes'],
  navigationKey: 'release.title.v7.navigation',
  proofLanes: Object.freeze([
    { id: 'table-parity', label: 'table parity', localizationKey: 'release.title.v7.proofLane.tableParity' },
    { id: 'scoped-node-io', label: 'scoped Node I/O', localizationKey: 'release.title.v7.proofLane.scopedNodeIo' },
    { id: 'blocklab', label: 'BlockLab', localizationKey: 'release.title.v7.proofLane.blocklab' },
    { id: 'release-title', label: 'release title', localizationKey: 'release.title.v7.proofLane.releaseTitle' },
  ]),
});

export const V7_LAUNCH_DOGFOOD_RELEASE_TITLE: DogfoodReleaseTitle = Object.freeze({
  id: 'v7-launch',
  title: 'V7 Launch Wake',
  titleKey: 'release.title.v7Launch.title',
  summary: 'Post-release title treatment, visible release proof, and lower-mode facts for DOGFOOD.',
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

export const DOGFOOD_RELEASE_TITLE_GALLERY: readonly DogfoodReleaseTitle[] = Object.freeze([
  V7_LAUNCH_DOGFOOD_RELEASE_TITLE,
  V7_DOGFOOD_RELEASE_TITLE,
]);

export const CURRENT_DOGFOOD_RELEASE_TITLE = V7_LAUNCH_DOGFOOD_RELEASE_TITLE;

export function dogfoodReleaseTitleFacts(
  release: DogfoodReleaseTitle = CURRENT_DOGFOOD_RELEASE_TITLE,
): readonly DogfoodReleaseTitleFact[] {
  return Object.freeze([
    { key: 'release_id', value: release.id },
    { key: 'release_title', value: release.title },
    ...(release.motif == null ? [] : [{ key: 'release_motif', value: release.motif }]),
    ...release.proofLanes.map((lane) => ({ key: 'proof_lane', value: lane.label })),
    { key: 'navigation_available', value: 'true' },
  ]);
}

export function dogfoodReleaseTitleMarkdown(
  localization?: LocalizationPort,
  release: DogfoodReleaseTitle = CURRENT_DOGFOOD_RELEASE_TITLE,
): string {
  return [
    '```text',
    renderDogfoodReleaseTitleText({ release, mode: 'interactive', width: 72, localization }),
    '```',
    '',
    '## Lower-mode facts',
    '',
    '```text',
    renderDogfoodReleaseTitleText({ release, mode: 'pipe', width: 72, localization }),
    '```',
  ].join('\n');
}

export function renderDogfoodReleaseTitleText(options: RenderDogfoodReleaseTitleTextOptions): string {
  const release = options.release ?? CURRENT_DOGFOOD_RELEASE_TITLE;
  if (options.mode === 'pipe') {
    return dogfoodReleaseTitleFacts(release)
      .map((fact) => `${fact.key}\t${fact.value}`)
      .join('\n');
  }

  const title = releaseTitle(release, options.localization);
  const subtitle = releaseSubtitle(release, options.localization);
  const proofLanes = release.proofLanes.map((lane) => releaseProofLaneLabel(lane, options.localization));
  const navigation = releaseNavigation(release, options.localization);
  const gate = releaseGate(release, options.localization);
  const motif = releaseMotif(release, options.localization);

  if (options.mode === 'accessible') {
    return [
      `DOGFOOD title screen for ${title}.`,
      `Current release proof lanes are ${proofLanes.join(', ')}.`,
      ...(motif == null ? [] : [`Visual motif: ${motif}`]),
      'Navigation remains available after the title.',
    ].join(' ');
  }

  if (options.mode === 'static') {
    return [
      'Bijou DOGFOOD release title.',
      `Release ${title}.`,
      `Proof lanes: ${proofLanes.join(', ')}.`,
      ...(motif == null ? [] : [`Motif: ${motif}`]),
    ].join(' ');
  }

  return options.width < 60
    ? renderNarrowReleaseTitle({ title, subtitle, proofLanes, gate, motif }, options.width)
    : renderWideReleaseTitle({ title, subtitle, proofLanes, gate, motif, navigation });
}

function releaseTitle(release: DogfoodReleaseTitle, localization?: LocalizationPort): string {
  return dogfoodLocalizedText(localization, release.titleKey, release.title);
}

function releaseSubtitle(release: DogfoodReleaseTitle, localization?: LocalizationPort): string {
  return dogfoodLocalizedText(localization, release.subtitleKey, release.subtitle);
}

function releaseGate(release: DogfoodReleaseTitle, localization?: LocalizationPort): string {
  return dogfoodLocalizedText(localization, release.gateKey, release.gate);
}

function releaseNavigation(release: DogfoodReleaseTitle, localization?: LocalizationPort): readonly string[] {
  const fallback = release.navigation.join(' | ');
  return dogfoodLocalizedText(localization, release.navigationKey, fallback).split(/\s*\|\s*/);
}

function releaseMotif(release: DogfoodReleaseTitle, localization?: LocalizationPort): string | undefined {
  if (release.motif == null || release.motifKey == null) return undefined;
  return dogfoodLocalizedText(localization, release.motifKey, release.motif);
}

function releaseProofLaneLabel(lane: DogfoodReleaseTitleProofLane, localization?: LocalizationPort): string {
  return dogfoodLocalizedText(localization, lane.localizationKey, lane.label);
}

function renderWideReleaseTitle(input: {
  readonly title: string;
  readonly subtitle: string;
  readonly proofLanes: readonly string[];
  readonly gate: string;
  readonly motif: string | undefined;
  readonly navigation: readonly string[];
}): string {
  return [
    '+ BIJOU DOGFOOD -------------------------------------------+',
    `| ${fitLine(input.title, 55)} |`,
    `| ${fitLine(input.subtitle, 55)} |`,
    '|                                                          |',
    `| ${fitLine(`Proof lanes: ${input.proofLanes.join(' | ')}`, 55)} |`,
    `| ${fitLine(`Release gate: ${input.gate}`, 55)} |`,
    ...(input.motif == null ? [] : [`| ${fitLine(`Motif: ${input.motif}`, 55)} |`]),
    '|                                                          |',
    `| ${fitLine(input.navigation.map((item) => `[${item}]`).join(' '), 55)} |`,
    '+----------------------------------------------------------+',
  ].join('\n');
}

function renderNarrowReleaseTitle(input: {
  readonly title: string;
  readonly subtitle: string;
  readonly proofLanes: readonly string[];
  readonly gate: string;
  readonly motif: string | undefined;
}, width: number): string {
  const frameWidth = Math.max(1, Math.floor(width));
  if (frameWidth < 4) return fitLine(input.title, frameWidth);
  const contentWidth = Math.max(0, frameWidth - 4);
  return [
    labeledRule(' BIJOU DOGFOOD ', frameWidth),
    `| ${fitLine(input.title, contentWidth)} |`,
    `| ${fitLine(shortenSubtitle(input.subtitle), contentWidth)} |`,
    `| ${fitLine(`lanes: ${input.proofLanes.slice(0, 2).join(', ')}`, contentWidth)} |`,
    `| ${fitLine(input.gate.includes('closeout') ? 'gate: closeout' : input.gate, contentWidth)} |`,
    ...(input.motif == null ? [] : [`| ${fitLine(shortenMotif(input.motif), contentWidth)} |`]),
    framedRule(frameWidth),
  ].join('\n');
}

function labeledRule(label: string, width: number): string {
  if (width <= 0) return '';
  if (width === 1) return '+';
  const innerWidth = Math.max(0, width - 2);
  const text = label.slice(0, innerWidth);
  return `+${text}${'-'.repeat(Math.max(0, innerWidth - text.length))}+`;
}

function framedRule(width: number): string {
  if (width <= 0) return '';
  if (width === 1) return '+';
  return `+${'-'.repeat(Math.max(0, width - 2))}+`;
}

function shortenSubtitle(subtitle: string): string {
  if (subtitle.startsWith('Blocks prove')) return 'Blocks prove UX.';
  if (subtitle.startsWith('A released')) return 'Release trail.';
  return subtitle;
}

function shortenMotif(motif: string): string {
  if (motif.startsWith('Wake lines')) return 'motif: wake lines';
  return `motif: ${motif}`;
}

function fitLine(value: string, width: number): string {
  const text = value.length <= width ? value : value.slice(0, Math.max(0, width - 1));
  return text.padEnd(width);
}
