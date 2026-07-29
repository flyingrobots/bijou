/**
 * Scenario: component-app — realistic app frame with bijou components.
 *
 * Renders a typical TUI application layout using actual bijou component
 * APIs: boxSurface, tableSurface, alertSurface, separatorSurface,
 * progressBar, badge, statsPanelSurface, sparkline. Components are
 * composed via Surface.blit into a multi-region layout with header,
 * sidebar, body, and footer.
 *
 * This is the scenario that other bench scenarios DON'T cover: the
 * real component rendering path that end-user apps hit — hex parsing,
 * token resolution, text segmentation, box border drawing, table
 * column alignment, and surface composition. Frame-over-frame, the
 * progress bar advances and the sparkline shifts, ensuring the differ
 * sees realistic partial updates.
 *
 * Exercises:
 * - Component rendering (boxSurface, tableSurface, alertSurface, etc.)
 * - Token-driven hex parsing in the hot path
 * - Surface composition via blit
 * - Realistic partial update pattern (progress + sparkline change per frame)
 */

import { createSurface, type BijouContext } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { Scenario } from './types.js';
import {
  paintComponentApp,
  type ComponentAppState,
} from './component-app-paint.js';

export const componentApp: Scenario<ComponentAppState> = {
  id: 'component-app',
  label: 'Component app: realistic bijou TUI (220×58)',
  tags: ['paint', 'compose', 'components', 'hex-parse'],
  description:
    'Renders a typical TUI application using real bijou components: boxSurface, tableSurface, alertSurface, separatorSurface, progressBar, badge, statsPanelSurface, sparkline. Tests the component rendering path — hex parsing, token resolution, text segmentation, box borders, table alignment, and surface composition. Progress bar and sparkline advance each frame for realistic partial updates.',
  columns: 220,
  rows: 58,
  defaultWarmupFrames: 30,
  defaultMeasureFrames: 120,

  setup(benchCtx?: BijouContext, columns = 220, rows = 58) {
    const ctx = benchCtx ?? createTestContext({ mode: 'interactive' });
    return {
      surface: createSurface(columns, rows),
      cols: columns,
      rows,
      ctx,
      sparkData: [],
    };
  },

  frame(state, frameIndex) {
    paintComponentApp(state, frameIndex);
  },

  getDisplaySurface(state) {
    return state.surface;
  },
};
