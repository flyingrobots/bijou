/**
 * Input feature events and semantic action maps.
 *
 * This module sits above raw terminal input parsing and below app/frame
 * reducers. It lets shells bind actions to semantic input feature events such
 * as "keyboard.tab double-tap" without hard-coding gesture state into a single
 * component.
 */

import type { KeyMsg } from './types.js';

export const DEFAULT_DOUBLE_TAP_MS = 300;
export const KEYBOARD_INPUT_DEVICE_ID = 'keyboard';

export type StandardInputFeatureEventType =
  | 'press'
  | 'held'
  | 'long-press'
  | 'release'
  | 'tap'
  | 'double-tap';

export type InputFeatureEventType = StandardInputFeatureEventType | (string & {});

export interface InputDevice {
  readonly id: string;
  readonly kind: string;
  readonly label?: string;
}

export interface InputFeature {
  readonly deviceId: string;
  readonly id: string;
  readonly kind: string;
  readonly label?: string;
}

export interface InputFeatureEvent {
  readonly feature: InputFeature;
  readonly type: InputFeatureEventType;
  readonly atMs: number;
}

export interface InputEvent {
  readonly device: InputDevice;
  readonly featureEvents: readonly InputFeatureEvent[];
  readonly atMs: number;
}

export interface InputFeatureEventPattern {
  readonly featureId: string;
  readonly type: InputFeatureEventType;
  readonly deviceId?: string;
}

export interface InputActionBinding<Action> {
  readonly id: string;
  readonly description: string;
  readonly featureEvents: readonly InputFeatureEventPattern[];
  readonly action: Action;
  readonly enabled: boolean;
}

export interface InputActionMap<Action> {
  bind(
    id: string,
    description: string,
    featureEvents: readonly InputFeatureEventPattern[],
    action: Action,
  ): InputActionMap<Action>;
  handle(event: InputEvent): Action | undefined;
  bindings(): readonly InputActionBinding<Action>[];
}

export interface InputGestureRecognizer {
  observeKey(msg: KeyMsg, atMs: number): InputEvent;
  reset(): void;
}

export interface InputGestureRecognizerOptions {
  readonly doubleTapMs?: number;
  readonly device?: InputDevice;
}

interface LastTap {
  readonly signature: string;
  readonly atMs: number;
}

export function defineInputDevice(device: InputDevice): InputDevice {
  return freezePlain({
    ...device,
    id: normalizeId(device.id, 'input device id'),
    kind: normalizeId(device.kind, 'input device kind'),
  });
}

export function defineInputFeature(feature: InputFeature): InputFeature {
  return freezePlain({
    ...feature,
    deviceId: normalizeId(feature.deviceId, 'input feature device id'),
    id: normalizeId(feature.id, 'input feature id'),
    kind: normalizeId(feature.kind, 'input feature kind'),
  });
}

export function keyboardFeature(key: string): InputFeature {
  const normalizedKey = normalizeId(key, 'keyboard feature key');
  return defineInputFeature({
    deviceId: KEYBOARD_INPUT_DEVICE_ID,
    id: `key.${normalizedKey}`,
    kind: 'key',
    label: normalizedKey,
  });
}

export function keyboardModifierFeature(modifier: 'ctrl' | 'alt' | 'shift'): InputFeature {
  return defineInputFeature({
    deviceId: KEYBOARD_INPUT_DEVICE_ID,
    id: `modifier.${modifier}`,
    kind: 'modifier',
    label: modifier,
  });
}

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
  const device = defineInputDevice(options.device ?? {
    id: KEYBOARD_INPUT_DEVICE_ID,
    kind: 'keyboard',
    label: 'Keyboard',
  });
  const doubleTapMs = normalizePositiveDuration(options.doubleTapMs, DEFAULT_DOUBLE_TAP_MS);
  let lastTap: LastTap | undefined;

  return {
    observeKey(msg, atMs) {
      const timestamp = normalizeTimestamp(atMs);
      const featureEvents: InputFeatureEvent[] = [];

      if (msg.ctrl) {
        featureEvents.push(inputFeatureEvent(keyboardModifierFeature('ctrl'), 'held', timestamp));
      }
      if (msg.alt) {
        featureEvents.push(inputFeatureEvent(keyboardModifierFeature('alt'), 'held', timestamp));
      }
      if (msg.shift) {
        featureEvents.push(inputFeatureEvent(keyboardModifierFeature('shift'), 'held', timestamp));
      }

      const keyFeature = keyboardFeature(msg.key);
      featureEvents.push(inputFeatureEvent(keyFeature, 'press', timestamp));
      featureEvents.push(inputFeatureEvent(keyFeature, 'tap', timestamp));

      const signature = keySignature(msg);
      const isDoubleTap = lastTap?.signature === signature
        && timestamp - lastTap.atMs <= doubleTapMs;

      if (isDoubleTap) {
        featureEvents.push(inputFeatureEvent(keyFeature, 'double-tap', timestamp));
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
      const normalizedFeatureEvents = featureEvents.map((featureEvent) => freezePlain({
        ...featureEvent,
        featureId: normalizeId(featureEvent.featureId, 'input action feature id'),
        type: normalizeId(featureEvent.type, 'input action event type'),
        deviceId: featureEvent.deviceId != null
          ? normalizeId(featureEvent.deviceId, 'input action device id')
          : undefined,
      }));
      bindings.push(freezePlain({
        id: normalizeId(id, 'input action id'),
        description,
        featureEvents: Object.freeze(normalizedFeatureEvents),
        action,
        enabled: true,
      }));
      return this;
    },
    handle(event) {
      return bindings.find((binding) => binding.enabled && inputEventMatches(event, binding.featureEvents))?.action;
    },
    bindings() {
      return Object.freeze([...bindings]);
    },
  };
}

export function inputEventMatches(
  event: InputEvent,
  patterns: readonly InputFeatureEventPattern[],
): boolean {
  return patterns.every((pattern) =>
    event.featureEvents.some((featureEvent) =>
      featureEvent.type === pattern.type
      && featureEvent.feature.id === pattern.featureId
      && (pattern.deviceId == null || featureEvent.feature.deviceId === pattern.deviceId),
    ),
  );
}

function keySignature(msg: KeyMsg): string {
  return [
    msg.ctrl ? 'ctrl' : '',
    msg.alt ? 'alt' : '',
    msg.shift ? 'shift' : '',
    msg.key,
  ].join('|');
}

function normalizeId(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === '') {
    throw new Error(`${label} is required`);
  }
  return normalized;
}

function normalizeTimestamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error('input event timestamp must be finite');
  }
  return value;
}

function normalizePositiveDuration(value: number | undefined, fallback: number): number {
  if (value == null) return fallback;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('input gesture doubleTapMs must be a positive finite number');
  }
  return value;
}

function freezePlain<T extends object>(value: T): T {
  return Object.freeze(value);
}
