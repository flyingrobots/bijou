export {
  componentMetadataReportText,
  componentMetadataSummary,
  defineComponentMetadata,
  validateComponentMetadata,
  type ComponentMetadata,
  type ComponentMetadataArg,
  type ComponentMetadataDocs,
  type ComponentMetadataExample,
  type ComponentMetadataInvariant,
  type ComponentMetadataIssue,
  type ComponentMetadataIssueKind,
  type ComponentMetadataReport,
  type ComponentMetadataSeverity,
  type ComponentMetadataVariant,
} from './core/component-metadata.js';

export {
  captureStoryMatrix,
  storyCaptureMatrixText,
  type StoryCapture,
  type StoryCaptureMatrix,
  type StoryCaptureMatrixOptions,
  type StoryCaptureProfile,
  type StoryCaptureRenderInput,
  type StoryCaptureVariant,
} from './core/story-capture.js';

export {
  createFixturePromotionRecord,
  fixturePromotionText,
  reverseFixturePromotionRecord,
  type FixturePromotionArtifact,
  type FixturePromotionArtifactKind,
  type FixturePromotionRecord,
  type FixturePromotionRecordOptions,
  type ReverseFixturePromotionOptions,
} from './core/fixture-promotion.js';

export {
  lintModeLowering,
  modeLoweringReportText,
  type ModeLoweringAssertionResult,
  type ModeLoweringFact,
  type ModeLoweringFactKind,
  type ModeLoweringFactValue,
  type ModeLoweringIssue,
  type ModeLoweringIssueKind,
  type ModeLoweringModeFacts,
  type ModeLoweringOptions,
  type ModeLoweringReport,
  type ModeLoweringSeverity,
} from './core/mode-lowering.js';

// Background fill utilities
export { shouldApplyBg, makeBgFill } from './core/bg-fill.js';

// Factory
export { createBijou, type CreateBijouOptions } from './factory.js';
