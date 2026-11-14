import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../adapters/test/index.js';
import { createSurface } from '../../ports/surface.js';
import {
  BrailleCanvas, areaY, barY, dot, lineY, plot, plotSurface, ruleX, ruleY, scaleLinear, scaleLog, scaleOklch,
} from './index.js';

describe('BrailleCanvas', () => {
  it('encodes 2x4 sub-pixel dots into Unicode Braille and clips offscreen lines in O(1)', () => {
    const canvas = new BrailleCanvas(5, 5);
    canvas.plotDot(0, 0, [56, 189, 248]);
    canvas.plotDot(1, 3, [56, 189, 248]);
    expect(canvas.getCellMask(0, 0)).toBe(0x81);

    canvas.clear();
    canvas.plotLine(-100_000, -100_000, -50_000, -50_000, [255, 0, 0]);
    for (let cy = 0; cy < 5; cy++) {
      for (let cx = 0; cx < 5; cx++) {
        expect(canvas.getCellMask(cx, cy)).toBe(0);
      }
    }

    canvas.plotLine(-1000, -1000, 1000, 1000, [0, 255, 0]);
    expect(canvas.getCellMask(0, 0)).toBeGreaterThan(0);
    expect(canvas.getCellMask(4, 2)).toBeGreaterThan(0);

    const surface = createSurface(5, 5);
    canvas.flushToSurface(surface);
    expect(surface.get(0, 0).fgRGB).toEqual([0, 255, 0]);
  });
});

describe('normalizePoints, missing data, and accessors', () => {
  it('preserves NaN missing samples and produces a genuine gap in lineY', () => {
    const mark = lineY([10, Number.NaN, 20]);
    expect(mark.points[0]).toEqual({ x: 0, y: 10 });
    expect(mark.points[1]?.x).toBe(1);
    expect(Number.isNaN(mark.points[1]?.y)).toBe(true);
    expect(mark.points[2]).toEqual({ x: 2, y: 20 });

    const surf = plotSurface({
      width: 12,
      height: 4,
      axes: false,
      grid: false,
      legend: false,
      x: scaleLinear([0, 2]),
      y: scaleLinear([0, 20]),
      marks: [mark],
    });
    const midCol = 6;
    for (let r = 0; r < 4; r++) {
      expect(surf.get(midCol, r).char).toBe(' ');
    }
  });

  it('resolves x, y, and colorValue accessors independently across numeric and object inputs', () => {
    const scaled = lineY([10, 20], { x: (_, i) => i * 100, y: (d) => d * 2 });
    expect(scaled.points).toEqual([
      { x: 0, y: 20 },
      { x: 100, y: 40 },
    ]);

    const heatPts = dot([{ x: 1, y: 2, heat: 90 }], {
      colorValue: (d) => d.heat,
      colorScale: scaleOklch([0, 100]),
    });
    expect(heatPts.points).toEqual([{ x: 1, y: 2, colorValue: 90 }]);
  });
});

describe('barY scale projection, logarithmic agreement, and mark-order collision', () => {
  it('projects barY around zero on signed linear domains [-10, 10]', () => {
    const surf = plotSurface({
      width: 6,
      height: 8,
      axes: false,
      grid: false,
      legend: false,
      x: scaleLinear([0, 2]),
      y: scaleLinear([-10, 10]),
      marks: [barY([-10, 0, 10])],
    });
    for (let r = 0; r < 8; r++) {
      expect(surf.get(2, r).char).toBe(' ');
    }
    expect(surf.get(5, 0).char).toBe('█');
    expect(surf.get(5, 7).char).toBe(' ');
    expect(surf.get(0, 0).char).toBe(' ');
    expect(surf.get(0, 7).char).toBe('█');
  });

  it('aligns barY top row and dot row on scaleLog([1, 100]) at y=10', () => {
    const logY = scaleLog([1, 100]);
    const barSurf = plotSurface({
      width: 4, height: 9, axes: false, grid: false, legend: false,
      x: scaleLinear([0, 1]), y: logY,
      marks: [barY([{ x: 0, y: 10 }])],
    });
    const dotSurf = plotSurface({
      width: 4, height: 9, axes: false, grid: false, legend: false,
      x: scaleLinear([0, 1]), y: logY,
      marks: [dot([{ x: 0, y: 10 }])],
    });
    let barTopRow = -1, dotRow = -1;
    for (let r = 0; r < 9; r++) {
      if (barTopRow < 0 && barSurf.get(0, r).char !== ' ') barTopRow = r;
      if (dotSurf.get(0, r).char !== ' ') dotRow = r;
    }
    expect(barTopRow).toBe(4);
    expect(dotRow).toBe(4);
  });

  it('respects declared mark order when barY and dot collide on the same cell', () => {
    const dotOverBar = plotSurface({
      width: 4, height: 4, axes: false, grid: false, legend: false,
      x: scaleLinear([0, 1]), y: scaleLinear([0, 100]),
      marks: [barY([{ x: 0, y: 100 }]), dot([{ x: 0, y: 50 }])],
    });
    const barOverDot = plotSurface({
      width: 4, height: 4, axes: false, grid: false, legend: false,
      x: scaleLinear([0, 1]), y: scaleLinear([0, 100]),
      marks: [dot([{ x: 0, y: 50 }]), barY([{ x: 0, y: 100 }])],
    });
    expect(dotOverBar.get(0, 2).char.codePointAt(0)).toBeGreaterThanOrEqual(0x2800);
    expect(barOverDot.get(0, 2).char).toBe('█');
  });

  it('serializes exact numbers in pipe mode (TSV) and summarizes accessible mode', () => {
    const pipeCtx = createTestContext({ mode: 'pipe' });
    const tsv = plot({
      width: 40, height: 10, ctx: pipeCtx,
      marks: [lineY([0.001, Number.NaN, 10001], { label: 'lat\t_ms' })],
    });
    expect(tsv).toBe('series\tcount\tx_min\tx_max\ty_min\ty_max\ty_last\nlat\\t_ms\t2\t0\t2\t0.001\t10001\t10001');

    const a11yCtx = createTestContext({ mode: 'accessible' });
    const summary = plot({
      title: 'CPU', width: 40, height: 10, ctx: a11yCtx,
      marks: [areaY([12, 64], { label: 'cpu' }), ruleY(80, { label: 'warn' }), ruleX(1)],
    });
    expect(summary).toContain('Plot: CPU.');
    expect(summary).toContain('Horizontal rule (warn) at y=80.');
  });
});
