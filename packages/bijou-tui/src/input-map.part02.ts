import {
  type InputActionBinding,
  type InputActionMap,
  type InputFeature,
  type InputFeatureEvent,
  type InputFeatureEventType,
  type InputGestureRecognizer,
  type InputGestureRecognizerOptions,
  type LastTap,
  DEFAULT_DOUBLE_TAP_MS,
  KEYBOARD_INPUT_DEVICE_ID,
  defineInputDevice,
  keyboardFeature,
  keyboardModifierFeature,
} from './input-map.part01.js';
import {
  freezePlain,
  keySignature,
  normalizeId,
  normalizePositiveDuration,
  normalizeTimestamp,
} from './input-map.part03.js';
import { inputEventMatches } from './input-map.part04.js';

export function inputFeatureEvent(
  feature: InputFeature,
  type: InputFeatureEventType,
  atMs: number,
): InputFeatureEvent {
  return freezePlain({
    feature,
    type: normalizeId(type, 'input feature event type'),
    atMs: normalizeTimestamp(atMs),
  });
}
export function createInputGestureRecognizer(
  options: InputGestureRecognizerOptions = {},
): InputGestureRecognizer {
  const device = defineInputDevice(
    options.device ?? {
      id: KEYBOARD_INPUT_DEVICE_ID,
      kind: 'keyboard',
      label: 'Keyboard',
    },
  );
  const doubleTapMs = normalizePositiveDuration(
    options.doubleTapMs,
    DEFAULT_DOUBLE_TAP_MS,
  );
  let lastTap: LastTap | undefined;

  return {
    observeKey(msg, atMs) {
      const timestamp = normalizeTimestamp(atMs);
      const featureEvents: InputFeatureEvent[] = [];

      if (msg.ctrl) {
        featureEvents.push(
          inputFeatureEvent(keyboardModifierFeature('ctrl'), 'held', timestamp),
        );
      }
      if (msg.alt) {
        featureEvents.push(
          inputFeatureEvent(keyboardModifierFeature('alt'), 'held', timestamp),
        );
      }
      if (msg.shift) {
        featureEvents.push(
          inputFeatureEvent(
            keyboardModifierFeature('shift'),
            'held',
            timestamp,
          ),
        );
      }

      const keyFeature = keyboardFeature(msg.key);
      featureEvents.push(inputFeatureEvent(keyFeature, 'press', timestamp));
      featureEvents.push(inputFeatureEvent(keyFeature, 'tap', timestamp));

      const signature = keySignature(msg);
      const isDoubleTap =
        lastTap?.signature === signature &&
        timestamp - lastTap.atMs <= doubleTapMs;

      if (isDoubleTap) {
        featureEvents.push(
          inputFeatureEvent(keyFeature, 'double-tap', timestamp),
        );
        lastTap = undefined;
      } else {
        lastTap = { signature, atMs: timestamp };
      }

      return freezePlain({
        device,
        featureEvents: Object.freeze(featureEvents),
        atMs: timestamp,
      });
    },
    reset() {
      lastTap = undefined;
    },
  };
}
export function createInputActionMap<Action>(): InputActionMap<Action> {
  const bindings: InputActionBinding<Action>[] = [];

  return {
    bind(id, description, featureEvents, action) {
      const normalizedFeatureEvents = featureEvents.map((featureEvent) =>
        freezePlain({
          ...featureEvent,
          featureId: normalizeId(
            featureEvent.featureId,
            'input action feature id',
          ),
          type: normalizeId(featureEvent.type, 'input action event type'),
          deviceId:
            featureEvent.deviceId != null
              ? normalizeId(featureEvent.deviceId, 'input action device id')
              : undefined,
        }),
      );
      bindings.push(
        freezePlain({
          id: normalizeId(id, 'input action id'),
          description,
          featureEvents: Object.freeze(normalizedFeatureEvents),
          action,
          enabled: true,
        }),
      );
      return this;
    },
    handle(event) {
      return bindings.find(
        (binding) =>
          binding.enabled && inputEventMatches(event, binding.featureEvents),
      )?.action;
    },
    bindings() {
      return Object.freeze([...bindings]);
    },
  };
}
