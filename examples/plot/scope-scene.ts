import { boxSurface, createSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import {
  BrailleCanvas,
  HalfBlockCanvas,
  barY,
  dot,
  lineY,
  plotSurface,
  ruleX,
  ruleY,
  scaleLinear,
  scaleLog,
  writePlotText,
} from '@flyingrobots/bijou/viz';
import { createHeatScale, type VizModel } from './btop-types.js';

export function createInitialWaterfall(width = 56, height = 13): HalfBlockCanvas {
  const canvas = new HalfBlockCanvas(width, height);
  const heat = createHeatScale('inferno');
  for (let py = 0; py < canvas.pixelHeight; py++) {
    const phase = py * 0.18;
    for (let px = 0; px < canvas.pixelWidth; px++) {
      const f = px / Math.max(1, canvas.pixelWidth - 1);
      const ridge1 = Math.exp(-(((f - (0.28 + 0.12 * Math.sin(phase))) / 0.11) ** 2)) * 88;
      const ridge2 = Math.exp(-(((f - (0.68 + 0.10 * Math.cos(phase * 0.8))) / 0.14) ** 2)) * 72;
      const floor = 12 + 8 * Math.sin(px * 0.4 + phase);
      canvas.setPixel(px, py, heat(Math.min(100, ridge1 + ridge2 + floor)).rgb);
    }
  }
  return canvas;
}

export function stepWaterfall(canvas: HalfBlockCanvas, phase: number, palette: VizModel['palette']): void {
  canvas.shiftDown(1);
  const heat = createHeatScale(palette);
  for (let px = 0; px < canvas.pixelWidth; px++) {
    const f = px / Math.max(1, canvas.pixelWidth - 1);
    const r1 = Math.exp(-(((f - (0.28 + 0.14 * Math.sin(phase))) / 0.11) ** 2)) * 90;
    const r2 = Math.exp(-(((f - (0.68 + 0.12 * Math.cos(phase * 0.7))) / 0.13) ** 2)) * 76;
    const val = Math.min(100, Math.max(8, r1 + r2 + 12 + 6 * Math.sin(px * 0.35 + phase * 2)));
    canvas.setPixel(px, 0, heat(val).rgb);
  }
}

function renderVectorscope(width: number, height: number, phase: number, model: VizModel, ctx: BijouContext): Surface {
  const innerW = Math.max(8, width - 2), innerH = Math.max(4, height - 2);
  const inner = createSurface(innerW, innerH);
  const canvas = new BrailleCanvas(innerW, innerH);
  const heat = createHeatScale(model.palette);
  const cx = (canvas.pixelWidth - 1) / 2, cy = (canvas.pixelHeight - 1) / 2;
  const rx = Math.max(2, cx - 2), ry = Math.max(2, cy - 2);
  const steps = 160;
  let prevX = cx + rx * Math.sin(phase), prevY = cy;
  for (let s = 1; s <= steps; s++) {
    const t = (s / steps) * Math.PI * 2;
    const x = cx + rx * Math.sin(3 * t + phase);
    const y = cy + ry * Math.sin(4 * t);
    canvas.plotLine(prevX, prevY, x, y, heat((s / steps) * 90 + 10).rgb);
    prevX = x; prevY = y;
  }
  canvas.flushToSurface(inner, 0, 0);
  return boxSurface(inner, { title: 'XY Stereo Vectorscope (3:4 Lissajous)', width, ctx });
}

export function renderScopeSurface(model: VizModel, ctx: BijouContext): Surface {
  const cols = Math.max(76, model.cols), rows = Math.max(30, model.rows);
  const root = createSurface(cols, rows);
  const availH = rows - 1;
  const topH = Math.max(12, Math.floor(availH * 0.45));
  const botH = Math.max(12, availH - topH);
  const rightW = Math.min(44, Math.max(32, Math.floor(cols * 0.40)));
  const leftW = Math.max(38, cols - rightW - 1);
  const phase = model.elapsedSec * 2.4 + 1.2;
  const heat = createHeatScale(model.palette);

  const ch1: number[] = [], ch2: number[] = [];
  for (let i = 0; i < 48; i++) {
    const t = i / 47;
    ch1.push(Math.sin(t * Math.PI * 4 + phase) * 65 + Math.cos(t * Math.PI * 10 - phase) * 22);
    ch2.push(Math.cos(t * Math.PI * 3 - phase * 0.8) * 52 + Math.sin(t * Math.PI * 7 + phase) * 18);
  }
  const cursor = Math.max(0, Math.min(47, model.cursorIdx));
  const oscPlot = plotSurface({
    title: `Dual-Trace Time-Domain (Ch1 ${(ch1[cursor] ?? 0).toFixed(1)}mV · Ch2 ${(ch2[cursor] ?? 0).toFixed(1)}mV)`,
    width: leftW - 2, height: Math.max(6, topH - 2), ctx,
    y: scaleLinear([-100, 100]),
    marks: [
      lineY(ch1, { label: 'Ch1', stroke: '#38bdf8' }),
      lineY(ch2, { label: 'Ch2', stroke: '#f43f5e' }),
      ruleY(0, { label: '0V', stroke: '#64748b' }),
      ruleX(cursor, { stroke: '#a78bfa' }),
    ],
  });
  root.blit(boxSurface(oscPlot, { title: 'Deck 2 // DSP Oscilloscope (2x4 Braille)', width: leftW, ctx }), 0, 0);
  root.blit(renderVectorscope(rightW, topH, phase, model, ctx), leftW + 1, 0);

  const fftBars: { x: number; y: number }[] = [];
  const fftPeaks: { x: number; y: number; colorValue: number }[] = [];
  const logX = scaleLog([20, 20000], [0, 31]);
  for (let b = 0; b < 32; b++) {
    const freq = logX.invert(b);
    const fNorm = b / 31;
    const pwr = Math.min(72, Math.max(6,
      Math.exp(-(((fNorm - (0.28 + 0.12 * Math.sin(phase))) / 0.13) ** 2)) * 68 +
      Math.exp(-(((fNorm - (0.68 + 0.10 * Math.cos(phase * 0.7))) / 0.15) ** 2)) * 56 + 8));
    fftBars.push({ x: freq, y: pwr });
    fftPeaks.push({ x: freq, y: Math.min(96, pwr + 16), colorValue: pwr + 20 });
  }
  const fftPlot = plotSurface({
    title: 'Log-Frequency Spectrum (20Hz–20kHz · scaleLog)',
    width: leftW - 2, height: Math.max(6, botH - 2), ctx,
    x: scaleLog([20, 20000]), y: scaleLinear([0, 100]),
    marks: [
      barY(fftBars, { label: 'dBFS', stroke: '#34d399' }),
      dot(fftPeaks, { label: 'peak', colorScale: heat }),
    ],
  });
  root.blit(boxSurface(fftPlot, { title: 'FFT Analyzer (scaleLog + 1x8 barY)', width: leftW, ctx }), 0, topH);

  const wfInner = createSurface(Math.max(8, rightW - 2), Math.max(4, botH - 2));
  model.waterfall.flushToSurface(wfInner, 0, 0);
  root.blit(boxSurface(wfInner, { title: '1x2 Half-Block (▀) Waterfall Spectrogram', width: rightW, ctx }), leftW + 1, topH);

  const footer = ` [Tab] view:SCOPE  [Space] ${model.paused ? 'resume' : 'freeze'}  [←/→] probe  [1-4] ${model.palette}  [q] quit `;
  writePlotText(root, 1, rows - 1, footer.slice(0, cols - 2), [148, 163, 184]);
  return root;
}
