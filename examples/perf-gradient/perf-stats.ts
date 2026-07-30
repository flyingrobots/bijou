import { createSurface } from '@flyingrobots/bijou';
import {
  GRAPH_SAMPLES,
  phaseTiming,
  type Model,
} from './perf-model.js';
import {
  readViewTime,
  renderBrailleLineChart,
  viewTimeCount,
} from './perf-chart.js';
import { stampText } from './perf-surface.js';

const BG = '#000000';
const FG = '#cccccc';

export function renderStats(
  surface: ReturnType<typeof createSurface>,
  model: Model,
): void {
  const stats = statLines(model);
  const graphWidth = 30;
  const graphHeight = 6;
  const axisWidth = 6;
  const textWidth = Math.max(...stats.map((line) => line.text.length));
  const boxWidth = Math.max(textWidth + 4, graphWidth + axisWidth + 5);
  const boxHeight = stats.length + 2 + graphHeight + 3;
  if (model.cols < boxWidth + 2 || model.rows < boxHeight + 2) return;
  for (let row = 1; row < 1 + boxHeight; row++) {
    for (let column = 1; column < 1 + boxWidth; column++) {
      surface.set(column, row, { char: ' ', bg: BG, fg: FG });
    }
  }
  for (const [index, stat] of stats.entries()) {
    if (stat.text !== '') {
      stampText(surface, 3, 2 + index, stat.text, stat.fg, BG);
    }
  }
  const graphTop = 2 + stats.length + 1;
  const graphLeft = 3 + axisWidth;
  let maxViewTime = 4;
  for (let index = 0; index < viewTimeCount(); index++) {
    maxViewTime = Math.max(maxViewTime, readViewTime(index));
  }
  maxViewTime = Math.ceil(maxViewTime);
  stampText(surface, 3, graphTop - 1, 'render time (ms)', '#666666', BG);
  stampText(
    surface,
    3,
    graphTop,
    `${maxViewTime.toFixed(0).padStart(4)}┤`,
    '#555555',
    BG,
  );
  stampText(
    surface,
    3,
    graphTop + Math.floor(graphHeight / 2),
    `${(maxViewTime / 2).toFixed(0).padStart(4)}┤`,
    '#555555',
    BG,
  );
  stampText(
    surface,
    3,
    graphTop + graphHeight - 1,
    '   0┤',
    '#555555',
    BG,
  );
  renderBrailleLineChart(
    surface,
    graphLeft,
    graphTop,
    graphWidth,
    graphHeight,
    maxViewTime,
    '#00cc66',
    BG,
    '#444444',
    maxViewTime > 16.7 ? 16.7 : undefined,
  );
  const label = `last ${String(GRAPH_SAMPLES)}`;
  stampText(
    surface,
    graphLeft,
    graphTop + graphHeight,
    `╰${'─'.repeat(Math.max(1, graphWidth - label.length - 1))} ${label}`,
    '#555555',
    BG,
  );
}

function statLines(
  model: Model,
): readonly { text: string; fg: string }[] {
  const timeColor = (milliseconds: number): string =>
    milliseconds < 2 ? '#00cc66' : milliseconds < 8 ? '#ccaa00' : '#cc3333';
  return [
    { text: `FPS   ${model.fps.toFixed(0).padStart(5)}`, fg: '#00ff88' },
    { text: `frame ${String(model.frame).padStart(7)}`, fg: FG },
    { text: `time  ${(model.elapsed / 1000).toFixed(1).padStart(6)}s`, fg: FG },
    { text: `ft    ${model.frameTimeMs.toFixed(1).padStart(5)}ms`, fg: '#ffaa00' },
    { text: `size  ${String(model.cols)}×${String(model.rows)}  (${String(model.cols * model.rows)} cells)`, fg: FG },
    { text: `cap   ${model.capped ? '60fps' : 'OFF'}`, fg: model.capped ? FG : '#ff6666' },
    { text: `mode  ${String(model.mode + 1)}`, fg: FG },
    { text: `mouse ${model.mouseDown ? 'DOWN' : 'up'}`, fg: FG },
    { text: '', fg: FG },
    { text: '── timing ────────────', fg: '#555555' },
    { text: `upd   ${phaseTiming.updateMs.toFixed(1).padStart(5)}ms`, fg: timeColor(phaseTiming.updateMs) },
    { text: `view  ${phaseTiming.viewMs.toFixed(1).padStart(5)}ms`, fg: timeColor(phaseTiming.viewMs) },
    { text: '', fg: FG },
    { text: '── memory ────────────', fg: '#555555' },
    { text: `heap  ${model.mem.heapUsedMB.toFixed(1)}/${model.mem.heapTotalMB.toFixed(1)} MB`, fg: '#88aaff' },
    { text: `rss   ${model.mem.rssMB.toFixed(1)} MB`, fg: '#88aaff' },
    { text: `ext   ${model.mem.externalMB.toFixed(1)} MB`, fg: '#88aaff' },
    { text: `gc    ${String(model.mem.gcCountSinceLastSample)}/0.5s`, fg: model.mem.gcCountSinceLastSample > 5 ? '#ff6666' : '#88aaff' },
  ];
}
