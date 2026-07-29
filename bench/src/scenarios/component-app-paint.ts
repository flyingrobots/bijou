import {
  alertSurface,
  badge,
  boxSurface,
  progressBar,
  separatorSurface,
  sparkline,
  statsPanelSurface,
  tableSurface,
  type BijouContext,
  type Surface,
} from '@flyingrobots/bijou';

export interface ComponentAppState {
  readonly surface: Surface;
  readonly cols: number;
  readonly rows: number;
  readonly ctx: BijouContext;
  sparkData: number[];
}

const SIDEBAR_WIDTH = 28;
const HEADER_ROWS = 3;
const FOOTER_ROWS = 1;

export function paintComponentApp(
  state: ComponentAppState,
  frameIndex: number,
): void {
  const { surface, cols, rows, ctx, sparkData } = state;
  surface.clear();

  const bodyWidth = Math.max(1, cols - SIDEBAR_WIDTH - 1);
  const headerAlert = alertSurface(
    `Build #${String(1042 + (frameIndex % 100))} passed — deployed to staging`,
    { variant: 'success', ctx },
  );
  surface.blit(headerAlert, 0, 0);

  const percent = (frameIndex * 0.7) % 100;
  sparkData.push(Math.sin(frameIndex * 0.1) * 40 + 50);
  if (sparkData.length > 20) sparkData.shift();

  const sidePanel = statsPanelSurface(
    [
      { label: 'uptime', value: '4d 12h' },
      { label: 'requests', value: '1.2M' },
      { label: 'errors', value: '0.03%' },
      { label: 'p99', value: '42ms', sparkline: sparkData },
      { label: 'CPU', value: `${String(Math.round(percent))}%` },
    ],
    { title: 'System', width: SIDEBAR_WIDTH, ctx },
  );
  surface.blit(sidePanel, 0, HEADER_ROWS);

  const badgeY = HEADER_ROWS + sidePanel.height + 1;
  if (badgeY < rows - FOOTER_ROWS) {
    const healthyBadge = badge('healthy', { variant: 'success', ctx });
    const versionBadge = badge('v4.3.0', { variant: 'info', ctx });
    surface.blit(healthyBadge, 1, badgeY);
    surface.blit(versionBadge, 1 + healthyBadge.width + 1, badgeY);
  }

  const tableWidth = Math.max(1, Math.min(bodyWidth - 2, 60));
  const table = tableSurface({
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
  surface.blit(table, SIDEBAR_WIDTH + 1, HEADER_ROWS);

  const progressY = HEADER_ROWS + table.height + 1;
  if (progressY < rows - FOOTER_ROWS) {
    const bar = progressBar(percent, { width: Math.min(tableWidth, 40), ctx });
    const barBox = boxSurface(`Deploy progress\n${bar}`, {
      width: Math.min(tableWidth + 4, bodyWidth),
      title: 'Rollout',
      ctx,
    });
    surface.blit(barBox, SIDEBAR_WIDTH + 1, progressY);
  }

  const separatorY = HEADER_ROWS + table.height + 6;
  if (separatorY + 3 < rows - FOOTER_ROWS) {
    const separator = separatorSurface({
      label: 'Recent Events',
      width: bodyWidth,
      ctx,
    });
    surface.blit(separator, SIDEBAR_WIDTH + 1, separatorY);
    const eventBox = boxSurface(
      'Deploy api-gateway@4.3.1 completed\n' +
        'Alert: cache-layer latency > 80ms\n' +
        'Scale-up: data-pipeline 3→5 replicas',
      { width: Math.min(bodyWidth, 50), ctx },
    );
    surface.blit(eventBox, SIDEBAR_WIDTH + 1, separatorY + 1);
  }

  const footerLine = ` ${sparkline(sparkData, { width: 10 })}  p99: 42ms  errors: 0.03%  nodes: 12`;
  for (let x = 0; x < Math.min(cols, footerLine.length); x++) {
    surface.set(x, rows - 1, {
      char: footerLine.charAt(x),
      empty: false,
    });
  }
}
