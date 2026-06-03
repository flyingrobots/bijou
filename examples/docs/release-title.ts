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
  readonly subtitle: string;
  readonly subtitleKey: string;
  readonly gate: string;
  readonly gateKey: string;
  readonly navigation: readonly string[];
  readonly navigationKey: string;
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

export function dogfoodReleaseTitleFacts(
  release: DogfoodReleaseTitle = V7_DOGFOOD_RELEASE_TITLE,
): readonly DogfoodReleaseTitleFact[] {
  return Object.freeze([
    { key: 'release_id', value: release.id },
    { key: 'release_title', value: release.title },
    ...release.proofLanes.map((lane) => ({ key: 'proof_lane', value: lane.label })),
    { key: 'navigation_available', value: 'true' },
  ]);
}

export function dogfoodReleaseTitleMarkdown(
  localization?: LocalizationPort,
  release: DogfoodReleaseTitle = V7_DOGFOOD_RELEASE_TITLE,
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
  const release = options.release ?? V7_DOGFOOD_RELEASE_TITLE;
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

  if (options.mode === 'accessible') {
    return [
      `DOGFOOD title screen for ${title}.`,
      `Current release proof lanes are ${proofLanes.join(', ')}.`,
      'Navigation remains available after the title.',
    ].join(' ');
  }

  if (options.mode === 'static') {
    return [
      'Bijou DOGFOOD release title.',
      `Release ${title}.`,
      `Proof lanes: ${proofLanes.join(', ')}.`,
    ].join(' ');
  }

  return options.width < 42
    ? renderNarrowReleaseTitle({ title, subtitle, proofLanes, gate })
    : renderWideReleaseTitle({ title, subtitle, proofLanes, gate, navigation });
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

function releaseProofLaneLabel(lane: DogfoodReleaseTitleProofLane, localization?: LocalizationPort): string {
  return dogfoodLocalizedText(localization, lane.localizationKey, lane.label);
}

function renderWideReleaseTitle(input: {
  readonly title: string;
  readonly subtitle: string;
  readonly proofLanes: readonly string[];
  readonly gate: string;
  readonly navigation: readonly string[];
}): string {
  return [
    '+ BIJOU DOGFOOD -------------------------------------------+',
    `| ${fitLine(input.title, 55)} |`,
    `| ${fitLine(input.subtitle, 55)} |`,
    '|                                                          |',
    `| ${fitLine(`Proof lanes: ${input.proofLanes.join(' | ')}`, 55)} |`,
    `| ${fitLine(`Release gate: ${input.gate}`, 55)} |`,
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
}): string {
  return [
    '+ BIJOU DOGFOOD ----+',
    `| ${fitLine(input.title, 18)} |`,
    `| ${fitLine(shortenSubtitle(input.subtitle), 18)} |`,
    `| ${fitLine(`lanes: ${input.proofLanes.slice(0, 2).join(', ')}`, 18)} |`,
    `| ${fitLine(input.gate.includes('closeout') ? 'gate: closeout' : input.gate, 18)} |`,
    '+-------------------+',
  ].join('\n');
}

function shortenSubtitle(subtitle: string): string {
  if (subtitle.startsWith('Blocks prove')) return 'Blocks prove UX.';
  return subtitle;
}

function fitLine(value: string, width: number): string {
  const text = value.length <= width ? value : value.slice(0, Math.max(0, width - 1));
  return text.padEnd(width);
}
