import { readFileSync } from 'node:fs';

interface CoverageStoryLike {
  readonly coverageFamilyIds?: readonly string[];
}

export interface DogfoodCoverageFamily {
  readonly id: string;
  readonly label: string;
}

export interface DogfoodDocsCoverage {
  readonly referenceFamilies: readonly DogfoodCoverageFamily[];
  readonly coveredFamilyIds: readonly string[];
  readonly totalFamilies: number;
  readonly documentedFamilies: number;
  readonly percent: number;
}

const COMPONENT_FAMILY_REFERENCE_TEXT = readFileSync(
  new URL('../../docs/design-system/component-families.md', import.meta.url),
  'utf8',
);

export const DOGFOOD_COMPONENT_FAMILY_REFERENCE = Object.freeze(parseComponentFamilyReference(COMPONENT_FAMILY_REFERENCE_TEXT));

export function resolveDogfoodDocsCoverage(stories: readonly CoverageStoryLike[]): DogfoodDocsCoverage {
  const knownFamilyIds = new Set(DOGFOOD_COMPONENT_FAMILY_REFERENCE.map((family) => family.id));
  const coveredFamilyIds = [...new Set(stories.flatMap((story) => story.coverageFamilyIds ?? []))];
  const unknownFamilyIds = coveredFamilyIds.filter((id) => !knownFamilyIds.has(id));

  if (unknownFamilyIds.length > 0) {
    throw new Error(`Unknown DOGFOOD coverage family id(s): ${unknownFamilyIds.join(', ')}`);
  }

  const totalFamilies = DOGFOOD_COMPONENT_FAMILY_REFERENCE.length;
  const documentedFamilies = coveredFamilyIds.length;

  return {
    referenceFamilies: DOGFOOD_COMPONENT_FAMILY_REFERENCE,
    coveredFamilyIds,
    totalFamilies,
    documentedFamilies,
    percent: totalFamilies <= 0 ? 0 : Math.round((documentedFamilies / totalFamilies) * 100),
  };
}

function parseComponentFamilyReference(markdown: string): readonly DogfoodCoverageFamily[] {
  const matches = [...markdown.matchAll(/^### (.+)$/gm)];
  const families = matches.map((match) => {
    const label = match[1]!.trim();
    return {
      id: slugifyHeading(label),
      label,
    };
  });

  const seen = new Set<string>();
  for (const family of families) {
    if (seen.has(family.id)) {
      throw new Error(`Duplicate DOGFOOD coverage family id "${family.id}" in component family reference`);
    }
    seen.add(family.id);
  }

  return families;
}

function slugifyHeading(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
