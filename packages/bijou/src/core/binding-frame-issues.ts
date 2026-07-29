import type { ActiveBindingCollection } from './active-binding-collection.js';
import type {
  BindingIssue,
  ProviderResolution,
  RequirementId,
} from './binding.js';

export function providerAssignmentMismatchIssues(
  collection: ActiveBindingCollection,
  resolutions: readonly ProviderResolution[],
): readonly BindingIssue[] {
  const providers = new Map<RequirementId, string>();
  for (const entry of collection.entries()) {
    if (entry.providerId !== undefined) {
      providers.set(entry.requirement.id, entry.providerId);
    }
  }
  return freezeBindingIssues(
    resolutions.flatMap((resolution) => {
      const expected = providers.get(resolution.requirementId);
      if (
        expected === undefined ||
        resolution.providerId === undefined ||
        resolution.providerId === expected
      ) {
        return [];
      }
      return [
        {
          severity: 'error',
          code: 'provider.assignment-mismatch',
          message:
            `Resolved provider ${resolution.providerId} for requirement ` +
            `${resolution.requirementId}; expected ${expected}`,
          path: resolution.requirementId,
        } satisfies BindingIssue,
      ];
    }),
  );
}

export function freezeBindingIssues(
  issues: readonly BindingIssue[],
): readonly BindingIssue[] {
  return issues.length === 0
    ? Object.freeze([])
    : Object.freeze(issues.map((issue) => Object.freeze({ ...issue })));
}
