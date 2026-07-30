import type { UiSceneValidationIssue } from './ui-scene-contract.js';

export type UiTargetProfile =
  | {
      readonly kind: 'bijou-terminal';
      readonly cols: number;
      readonly rows: number;
      readonly requires?: readonly string[];
      readonly claims?: readonly string[];
    }
  | {
      readonly kind: 'geordi-browser' | 'geordi-image';
      readonly width: number;
      readonly height: number;
      readonly requires?: readonly string[];
      readonly claims?: readonly string[];
    }
  | {
      readonly kind: 'geordi-packed-bijou-cells';
      readonly cols: number;
      readonly rows: number;
      readonly requires?: readonly string[];
      readonly claims?: readonly string[];
    }
  | {
      readonly kind: 'geordi-unity' | 'external-visual-import';
      readonly requires?: readonly string[];
      readonly claims?: readonly string[];
    }
  | {
      readonly kind: `custom:${string}`;
      readonly requires?: readonly string[];
      readonly claims?: readonly string[];
    };

export type UiPortabilityLevel =
  | 'portable'
  | 'terminal-native'
  | 'visual-only'
  | 'host-adapter';

export interface UiPortabilityClaim {
  readonly level: UiPortabilityLevel;
  readonly reasons?: readonly string[];
}

export function validateTargetProfile(
  profile: UiTargetProfile,
  index: number,
): UiSceneValidationIssue | null {
  switch (profile.kind) {
    case 'bijou-terminal':
      return validPositiveDimension(profile.cols) &&
        validPositiveDimension(profile.rows)
        ? null
        : invalidTargetProfile(
            profile.kind,
            index,
            'bijou-terminal target profiles require positive integer cols and rows',
          );
    case 'geordi-browser':
    case 'geordi-image':
      return validPositiveDimension(profile.width) &&
        validPositiveDimension(profile.height)
        ? null
        : invalidTargetProfile(
            profile.kind,
            index,
            `${profile.kind} target profiles require positive integer width and height`,
          );
    case 'geordi-packed-bijou-cells':
      return validPositiveDimension(profile.cols) &&
        validPositiveDimension(profile.rows)
        ? null
        : invalidTargetProfile(
            profile.kind,
            index,
            'geordi-packed-bijou-cells target profiles require positive integer cols and rows',
          );
    case 'geordi-unity':
    case 'external-visual-import':
      return null;
    default:
      return profile.kind.startsWith('custom:')
        ? null
        : invalidTargetProfile(
            profile.kind,
            index,
            `Unknown target profile kind: ${profile.kind}`,
          );
  }
}

function invalidTargetProfile(
  kind: string,
  index: number,
  reason: string,
): UiSceneValidationIssue {
  return {
    code: 'invalid-target-profile',
    message: `Invalid target profile ${kind} at index ${String(index)}: ${reason}`,
    id: `${kind}:${String(index)}`,
  };
}

function validPositiveDimension(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}
