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

import {
  createSurface,
  boxSurface,
  tableSurface,
  separatorSurface,
  alertSurface,
  progressBar,
  badge,
  statsPanelSurface,
  sparkline,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { Scenario } from './types.js';

interface State {
  readonly surface: Surface;
  readonly cols: number;
  readonly rows: number;
  readonly ctx: BijouContext;
  sparkData: number[];
}

const SIDEBAR_WIDTH = 28;
const HEADER_ROWS = 3;
const FOOTER_ROWS = 1;

function paintApp(state: State, frameIndex: number): void {
  const { surface, cols, rows, ctx, sparkData } = state;
  surface.clear();

  const bodyWidth = Math.max(1, cols - SIDEBAR_WIDTH - 1);
  const bodyHeight = Math.max(1, rows - HEADER_ROWS - FOOTER_ROWS);

  // --- Header: alert banner ---
  const headerAlert = alertSurface(
    `Build #${1042 + (frameIndex % 100)} passed — deployed to staging`,
    { variant: 'success', ctx },
  );
  surface.blit(headerAlert, 0, 0);

  // --- Sidebar: stats panel + badges ---
  const percent = ((frameIndex * 0.7) % 100);

  // Shift sparkline data: push new value, keep last N.
  sparkData.push(Math.sin(frameIndex * 0.1) * 40 + 50);
  if (sparkData.length > 20) sparkData.shift();

  const sidePanel = statsPanelSurface([
    { label: 'uptime', value: '4d 12h' },
    { label: 'requests', value: '1.2M' },
    { label: 'errors', value: '0.03%' },
    { label: 'p99', value: '42ms', sparkline: sparkData },
    { label: 'CPU', value: `${Math.round(percent)}%` },
  ], {
    title: 'System',
    width: SIDEBAR_WIDTH,
    ctx,
  });
  surface.blit(sidePanel, 0, HEADER_ROWS);

  // Badges below the stats panel.
  const badgeY = HEADER_ROWS + sidePanel.height + 1;
  if (badgeY < rows - FOOTER_ROWS) {
    const b1 = badge('healthy', { variant: 'success', ctx });
    const b2 = badge('v4.3.0', { variant: 'info', ctx });
    surface.blit(b1, 1, badgeY);
    surface.blit(b2, 1 + b1.width + 1, badgeY);
  }

  // --- Body: table + progress ---
  const tableWidth = Math.max(1, Math.min(bodyWidth - 2, 60));
  const tbl = tableSurface({
    columns: [
      { header: 'Service' },
      { header: 'Status' },
      { header: 'Latency' },
      { header: 'RPM' },
    ],
    rows: [
      ['api-gateway', 'running', '12ms', '45.2k'],
      ['auth-service', 'running', '8ms', '12.1k'],
      ['data-pipeline', 'running', '142ms', '3.4k'],
      ['cache-layer', 'degraded', '89ms', '28.7k'],
      ['search-index', 'running', '34ms', '8.9k'],
      ['notification', 'running', '6ms', '1.2k'],
    ],
    ctx,
  });
  surface.blit(tbl, SIDEBAR_WIDTH + 1, HEADER_ROWS);

  // Progress bar below table.
  const progressY = HEADER_ROWS + tbl.height + 1;
  if (progressY < rows - FOOTER_ROWS) {
    const bar = progressBar(percent, { width: Math.min(tableWidth, 40), ctx });
    // progressBar returns a string — blit it as a simple text line.
    const barBox = boxSurface(`Deploy progress\n${bar}`, {
      width: Math.min(tableWidth + 4, bodyWidth),
      title: 'Rollout',
      ctx,
    });
    surface.blit(barBox, SIDEBAR_WIDTH + 1, progressY);
  }

  // Separator + secondary content if space permits.
  const sepY = HEADER_ROWS + tbl.height + 6;
  if (sepY + 3 < rows - FOOTER_ROWS) {
    const sep = separatorSurface({ label: 'Recent Events', width: bodyWidth, ctx });
    surface.blit(sep, SIDEBAR_WIDTH + 1, sepY);

    const eventBox = boxSurface(
      'Deploy api-gateway@4.3.1 completed\n' +
      'Alert: cache-layer latency > 80ms\n' +
      'Scale-up: data-pipeline 3→5 replicas',
      { width: Math.min(bodyWidth, 50), ctx },
    );
    surface.blit(eventBox, SIDEBAR_WIDTH + 1, sepY + 1);
  }

  // --- Footer: status line ---
  const footerLine = ` ${sparkline(sparkData, { width: 10 })}  p99: 42ms  errors: 0.03%  nodes: 12`;
  for (let x = 0; x < Math.min(cols, footerLine.length); x++) {
    surface.set(x, rows - 1, { char: footerLine[x]!, empty: false });
  }
}

export const componentApp: Scenario<State> = {
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
    paintApp(state, frameIndex);
  },

  getDisplaySurface(state) {
    return state.surface;
  },
};
