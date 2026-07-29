import type {
  InputEvent,
  InputFeatureEventPattern,
} from './input-map.part01.js';

export function inputEventMatches(
  event: InputEvent,
  patterns: readonly InputFeatureEventPattern[],
): boolean {
  return patterns.every((pattern) =>
    event.featureEvents.some(
      (featureEvent) =>
        featureEvent.type === pattern.type &&
        featureEvent.feature.id === pattern.featureId &&
        (pattern.deviceId == null ||
          featureEvent.feature.deviceId === pattern.deviceId),
    ),
  );
}
