import type { BlockPreviewPaneChrome } from './app-block-preview-panes.js';
import {
  insetPaneSurface,
  resolvePaneInnerWidth,
  themedSeparatorSurface,
} from './app-pane-geometry.js';
import { paragraphSurface } from './app-paragraph-surface.js';

export const BLOCK_PREVIEW_PANE_CHROME: BlockPreviewPaneChrome = {
  resolvePaneInnerWidth,
  insetPaneSurface,
  themedSeparatorSurface,
  paragraphSurface,
};
