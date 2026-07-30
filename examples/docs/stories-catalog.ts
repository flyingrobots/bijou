import type { ComponentStory } from './stories-runtime.js';
import { STORY_ALERT } from './stories-story-alert.js';
import { STORY_BADGE } from './stories-story-badge.js';
import { STORY_MODAL } from './stories-story-modal.js';
import { STORY_DRAWER } from './stories-story-drawer.js';
import { STORY_TOOLTIP } from './stories-story-tooltip.js';
import { STORY_PROGRESS_BAR } from './stories-story-progress-bar.js';
import { STORY_SKELETON } from './stories-story-skeleton.js';
import { STORY_TOAST } from './stories-story-toast.js';
import { STORY_LOG } from './stories-story-log.js';
import { STORY_CONFIRM } from './stories-story-confirm.js';
import { STORY_MULTISELECT } from './stories-story-multiselect.js';
import { STORY_SELECT } from './stories-story-select.js';
import { STORY_TEXT_ENTRY } from './stories-story-text-entry.js';
import { STORY_GROUP_WIZARD } from './stories-story-group-wizard.js';
import { STORY_TABS } from './stories-story-tabs.js';
import { STORY_MARKDOWN } from './stories-story-markdown.js';
import { STORY_HYPERLINK } from './stories-story-hyperlink.js';
import { STORY_BOX } from './stories-story-box.js';
import { STORY_INSPECTOR } from './stories-story-inspector.js';
import { STORY_GUIDED_FLOW } from './stories-story-guided-flow.js';
import { STORY_EXPLAINABILITY } from './stories-story-explainability.js';
import { STORY_SEPARATOR } from './stories-story-separator.js';
import { STORY_HELP_VIEW } from './stories-story-help-view.js';
import { STORY_NOTIFICATION_SYSTEM } from './stories-story-notification-system.js';
import { STORY_VIEWPORT_SURFACE } from './stories-story-viewport-surface.js';
import { STORY_KBD } from './stories-story-kbd.js';
import { STORY_TRANSIENT_APP_NOTIFICATIONS } from './stories-story-transient-app-notifications.js';
import { STORY_PROGRESSIVE_DISCLOSURE } from './stories-story-progressive-disclosure.js';
import { STORY_PATH_AND_PROGRESS } from './stories-story-path-and-progress.js';
import { STORY_EXPRESSIVE_BRANDING } from './stories-story-expressive-branding.js';
import { STORY_MODE_AWARE_CUSTOM_PRIMITIVES } from './stories-story-mode-aware-custom-primitives.js';
import { STORY_DENSE_COMPARISON } from './stories-story-dense-comparison.js';
import { STORY_HIERARCHY } from './stories-story-hierarchy.js';
import { STORY_LISTS_FOR_EXPLORATION } from './stories-story-lists-for-exploration.js';
import { STORY_TEMPORAL_OR_DEPENDENCY_VIEWS } from './stories-story-temporal-or-dependency-views.js';
import { STORY_MOTION_AND_SHADER_EFFECTS } from './stories-story-motion-and-shader-effects.js';
import { STORY_APP_SHELL } from './stories-story-app-shell.js';
import { STORY_WORKSPACE_LAYOUT } from './stories-story-workspace-layout.js';
import { STORY_SPARKLINE } from './stories-story-sparkline.js';
import { STORY_BRAILLE_CHART } from './stories-story-braille-chart.js';
import { STORY_STATS_PANEL } from './stories-story-stats-panel.js';
import { STORY_PERF_OVERLAY } from './stories-story-perf-overlay.js';

export const COMPONENT_STORIES = [
  STORY_ALERT,
  STORY_BADGE,
  STORY_MODAL,
  STORY_DRAWER,
  STORY_TOOLTIP,
  STORY_PROGRESS_BAR,
  STORY_SKELETON,
  STORY_TOAST,
  STORY_LOG,
  STORY_CONFIRM,
  STORY_MULTISELECT,
  STORY_SELECT,
  STORY_TEXT_ENTRY,
  STORY_GROUP_WIZARD,
  STORY_TABS,
  STORY_MARKDOWN,
  STORY_HYPERLINK,
  STORY_BOX,
  STORY_INSPECTOR,
  STORY_GUIDED_FLOW,
  STORY_EXPLAINABILITY,
  STORY_SEPARATOR,
  STORY_HELP_VIEW,
  STORY_NOTIFICATION_SYSTEM,
  STORY_VIEWPORT_SURFACE,
  STORY_KBD,
  STORY_TRANSIENT_APP_NOTIFICATIONS,
  STORY_PROGRESSIVE_DISCLOSURE,
  STORY_PATH_AND_PROGRESS,
  STORY_EXPRESSIVE_BRANDING,
  STORY_MODE_AWARE_CUSTOM_PRIMITIVES,
  STORY_DENSE_COMPARISON,
  STORY_HIERARCHY,
  STORY_LISTS_FOR_EXPLORATION,
  STORY_TEMPORAL_OR_DEPENDENCY_VIEWS,
  STORY_MOTION_AND_SHADER_EFFECTS,
  STORY_APP_SHELL,
  STORY_WORKSPACE_LAYOUT,
  STORY_SPARKLINE,
  STORY_BRAILLE_CHART,
  STORY_STATS_PANEL,
  STORY_PERF_OVERLAY,
] as const;

export function findComponentStory(id: string): ComponentStory | undefined {
  return COMPONENT_STORIES.find((story) => story.id === id);
}
