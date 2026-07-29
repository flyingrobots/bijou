/**
 * Input feature events and semantic action maps.
 *
 * This module sits above raw terminal input parsing and below app/frame
 * reducers. It lets shells bind actions to semantic input feature events such
 * as "keyboard.tab double-tap" without hard-coding gesture state into a single
 * component.
 */
import type { KeyMsg } from './types.js';
import { freezePlain, normalizeId } from './input-map.part03.js';

export const DEFAULT_DOUBLE_TAP_MS = 300;
export const KEYBOARD_INPUT_DEVICE_ID = 'keyboard';
export type StandardInputFeatureEventType =
  'press' | 'held' | 'long-press' | 'release' | 'tap' | 'double-tap';
export type InputFeatureEventType =
  StandardInputFeatureEventType | (string & {});
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
export interface LastTap {
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
export function keyboardModifierFeature(
  modifier: 'ctrl' | 'alt' | 'shift',
): InputFeature {
  return defineInputFeature({
    deviceId: KEYBOARD_INPUT_DEVICE_ID,
    id: `modifier.${modifier}`,
    kind: 'modifier',
    label: modifier,
  });
}
