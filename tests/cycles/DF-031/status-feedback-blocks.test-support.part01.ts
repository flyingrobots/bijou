import {
  activityStreamBlock,
  inFlowStatusBlock,
  inlineStatusBlock,
  progressIndicatorBlock,
  shortcutCueBlock,
  transientOverlayBlock,
} from '../../../packages/bijou/src/index.js';

const STATUS_FEEDBACK_BLOCKS = [
  inlineStatusBlock,
  inFlowStatusBlock,
  transientOverlayBlock,
  activityStreamBlock,
  shortcutCueBlock,
  progressIndicatorBlock,
] as const;

export { STATUS_FEEDBACK_BLOCKS };
