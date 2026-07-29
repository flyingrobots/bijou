export type {
  LocalizationStatus,
  LocalizationRequest,
  LocalizationIssueCode,
  LocalizationIssue,
  LocalizationFactKind,
  LocalizationFact,
  LocalizedObject,
  LocalizationPort,
  RuntimeLocalizationPortSource,
} from './localization.part01.js';
export { createRuntimeLocalizationPort } from './localization.part01.js';
export {
  freezeLocalizedObject,
  freezeLocalizedValue,
  isJsonShapedLocalizedValue,
} from './localization.part02.js';
