import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText } from './localization.js';
import {
  type DogfoodReleaseTitle,
  type DogfoodReleaseTitleProofLane,
  type RenderDogfoodReleaseTitleTextOptions,
  CURRENT_DOGFOOD_RELEASE_TITLE,
  dogfoodReleaseTitleFacts,
} from './release-title.part01.js';
import {
  renderNarrowReleaseTitle,
  renderWideReleaseTitle,
} from './release-title.part03.js';

export function dogfoodReleaseTitleMarkdown(
  localization?: LocalizationPort,
  release: DogfoodReleaseTitle = CURRENT_DOGFOOD_RELEASE_TITLE,
): string {
  return [
    '```text',
    renderDogfoodReleaseTitleText({
      release,
      mode: 'interactive',
      width: 72,
      localization,
    }),
    '```',
    '',
    '## Lower-mode facts',
    '',
    '```text',
    renderDogfoodReleaseTitleText({
      release,
      mode: 'pipe',
      width: 72,
      localization,
    }),
    '```',
  ].join('\n');
}
export function renderDogfoodReleaseTitleText(
  options: RenderDogfoodReleaseTitleTextOptions,
): string {
  const release = options.release ?? CURRENT_DOGFOOD_RELEASE_TITLE;
  if (options.mode === 'pipe') {
    return dogfoodReleaseTitleFacts(release)
      .map((fact) => `${fact.key}\t${fact.value}`)
      .join('\n');
  }

  const title = releaseTitle(release, options.localization);
  const subtitle = releaseSubtitle(release, options.localization);
  const proofLanes = release.proofLanes.map((lane) =>
    releaseProofLaneLabel(lane, options.localization),
  );
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
    ? renderNarrowReleaseTitle(
        { title, subtitle, proofLanes, gate, motif },
        options.width,
      )
    : renderWideReleaseTitle({
        title,
        subtitle,
        proofLanes,
        gate,
        motif,
        navigation,
      });
}
export function releaseTitle(
  release: DogfoodReleaseTitle,
  localization?: LocalizationPort,
): string {
  return dogfoodLocalizedText(localization, release.titleKey, release.title);
}
export function releaseSubtitle(
  release: DogfoodReleaseTitle,
  localization?: LocalizationPort,
): string {
  return dogfoodLocalizedText(
    localization,
    release.subtitleKey,
    release.subtitle,
  );
}
export function releaseGate(
  release: DogfoodReleaseTitle,
  localization?: LocalizationPort,
): string {
  return dogfoodLocalizedText(localization, release.gateKey, release.gate);
}
export function releaseNavigation(
  release: DogfoodReleaseTitle,
  localization?: LocalizationPort,
): readonly string[] {
  const fallback = release.navigation.join(' | ');
  return dogfoodLocalizedText(
    localization,
    release.navigationKey,
    fallback,
  ).split(/\s*\|\s*/);
}
export function releaseMotif(
  release: DogfoodReleaseTitle,
  localization?: LocalizationPort,
): string | undefined {
  if (release.motif == null || release.motifKey == null) return undefined;
  return dogfoodLocalizedText(localization, release.motifKey, release.motif);
}
export function releaseProofLaneLabel(
  lane: DogfoodReleaseTitleProofLane,
  localization?: LocalizationPort,
): string {
  return dogfoodLocalizedText(localization, lane.localizationKey, lane.label);
}
