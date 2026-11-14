import {
  areaY,
  barY,
  box,
  dot,
  lineY,
  plot,
  ruleY,
  scaleLinear,
  scaleOklch,
} from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';

const ctx = createTestContext({ mode: 'interactive' });

const samples = 48;
const p50: number[] = [];
const p99: number[] = [];
const requests: { readonly x: number; readonly y: number; readonly colorValue: number }[] = [];

for (let i = 0; i < samples; i++) {
  const t = i / (samples - 1);
  const base = 24 + 12 * Math.sin(t * Math.PI * 3);
  const tail = base * 2.1 + 18 * Math.cos(t * Math.PI * 5) ** 2;
  p50.push(base);
  p99.push(tail);
  requests.push({
    x: i,
    y: 45 + 38 * Math.sin(t * Math.PI * 4) * Math.cos(t * Math.PI * 2),
    colorValue: tail,
  });
}

const latencyChart = plot({
  title: 'Service Latency (ms)',
  width: 68,
  height: 12,
  ctx,
  y: scaleLinear([0, 100]),
  marks: [
    areaY(p50, { label: 'p50', stroke: '#38bdf8' }),
    lineY(p99, { label: 'p99', stroke: '#f43f5e' }),
    ruleY(80, { label: 'SLO (80ms)', stroke: '#f59e0b' }),
  ],
});

const heatScale = scaleOklch(
  [20, 95],
  [
    { l: 0.65, c: 0.14, h: 245 },
    { l: 0.78, c: 0.18, h: 30 },
  ],
);

const scatterAndBars = plot({
  title: 'Throughput & Perceptual OKLCH Scatter',
  width: 68,
  height: 11,
  ctx,
  y: scaleLinear([0, 100]),
  marks: [
    barY(
      p50.map((v, idx) => (idx % 3 === 0 ? v * 0.9 : 0)),
      { label: 'batch rps', stroke: '#34d399' },
    ),
    dot(requests, {
      label: 'trace sample',
      colorScale: heatScale,
    }),
  ],
});

console.log(box(`${latencyChart}\n\n${scatterAndBars}`, { title: 'Bijou Declarative Viz (@flyingrobots/bijou/viz)', ctx }));
