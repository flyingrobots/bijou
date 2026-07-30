import {
  clamp,
  type Model,
} from './perf-model.js';
import {
  PERF_DENSITY,
  PERF_NOISE,
} from './perf-noise.js';
import type { PerfSurface } from './perf-surface.js';

const { cos, PI, round } = Math;

export function fillGradientRgb(
  surface: PerfSurface,
  model: Model,
): void {
  const direction = model.mouseDown ? -1 : 1;
  const frame = model.frame * 0.05 * direction;
  for (let row = 0; row < model.rows; row++) {
    for (let column = 0; column < model.cols; column++) {
      const phase = (column + row * 0.5) * 0.08;
      const red = (cos(phase + frame) + 1) * 127.5;
      const green = (cos(phase + 2 * frame + 2 * PI / 3) + 1) * 127.5;
      const blue = (cos(phase + 3 * frame + 4 * PI / 3) + 1) * 127.5;
      const fgRed = (cos(phase * 0.06 + frame) + 1) * 127.5;
      const fgGreen =
        (cos(phase * 0.07 + 2 * frame + 2 * PI / 3) + 1) * 127.5;
      const fgBlue =
        (cos(phase * 0.08 + 3 * frame + 4 * PI / 3) + 1) * 127.5;
      surface.setRGB(
        column,
        row,
        0x2588,
        fgRed,
        fgGreen,
        fgBlue,
        red,
        green,
        blue,
      );
    }
  }
}

export function fillHorizonRgb(
  surface: PerfSurface,
  model: Model,
): void {
  const halfY = model.rows / 2;
  const halfX = model.cols / 2;
  const speed = model.mouseDown ? -0.3 : 0.3;
  for (let row = 0; row < model.rows; row++) {
    const z = row - halfY;
    for (let column = 0; column < model.cols; column++) {
      if (z === 0) {
        surface.setRGB(column, row, 0x2500, 255, 255, 255, 0, 0, 0);
        continue;
      }
      const value = (column - halfX) / z;
      const code =
        (Math.floor(value + halfX + model.frame * speed) % 94 + 94) % 94 + 33;
      const bright = round(clamp(1 - Math.abs(z) / halfY, 0, 1) * 200 + 55);
      surface.setRGB(
        column,
        row,
        code,
        bright,
        bright,
        bright,
        z < 0 ? round(bright * 0.3) : round(bright * 0.2),
        z < 0 ? round(bright * 0.4) : round(bright * 0.6),
        z < 0 ? bright : round(bright * 0.2),
      );
    }
  }
}

export function fillNoiseRgb(
  surface: PerfSurface,
  model: Model,
): void {
  const time = model.elapsed * 0.0007 * (model.mouseDown ? -1 : 1);
  for (let row = 0; row < model.rows; row++) {
    for (let column = 0; column < model.cols; column++) {
      const value =
        PERF_NOISE(column * 0.03, row * 0.03 / 0.5 + time * 1.3) * 0.5 + 0.5;
      const index = clamp(
        Math.floor(value * PERF_DENSITY.length),
        0,
        PERF_DENSITY.length - 1,
      );
      const char = PERF_DENSITY[index] ?? ' ';
      surface.setRGB(
        column,
        row,
        char,
        round(255 * value * 0.3 + 246 * (1 - value)),
        round(89 * value * 0.3 + 246 * (1 - value)),
        round(55 * value * 0.3 + 244 * (1 - value)),
        0,
        0,
        0,
      );
    }
  }
}
