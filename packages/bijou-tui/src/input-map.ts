export type {
  StandardInputFeatureEventType,
  InputFeatureEventType,
  InputDevice,
  InputFeature,
  InputFeatureEvent,
  InputEvent,
  InputFeatureEventPattern,
  InputActionBinding,
  InputActionMap,
  InputGestureRecognizer,
  InputGestureRecognizerOptions,
} from './input-map.part01.js';
export {
  DEFAULT_DOUBLE_TAP_MS,
  KEYBOARD_INPUT_DEVICE_ID,
  defineInputDevice,
  defineInputFeature,
  keyboardFeature,
  keyboardModifierFeature,
} from './input-map.part01.js';
export {
  inputFeatureEvent,
  createInputGestureRecognizer,
  createInputActionMap,
} from './input-map.part02.js';
export { inputEventMatches } from './input-map.part04.js';
