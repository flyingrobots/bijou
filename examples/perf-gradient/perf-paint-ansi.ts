import { createSurface } from '@flyingrobots/bijou';
import {
  clamp,
  rgbHex,
  type Model,
} from './perf-model.js';
import {
  PERF_DENSITY,
  PERF_NOISE,
} from './perf-noise.js';

const cell = { char: '█', fg: '', bg: '' };
const { cos, PI } = Math;

export function fillGradient(
  surface: ReturnType<typeof createSurface>,
  model: Model,
): void {
  const frame = model.frame * 0.05 * (model.mouseDown ? -1 : 1);
  for (let row = 0; row < model.rows; row++) {
    for (let column = 0; column < model.cols; column++) {
      const phase = (column + row * 0.5) * 0.08;
      cell.bg = rgbHex(
        (cos(phase + frame) + 1) * 127.5,
        (cos(phase + 2 * frame + 2 * PI / 3) + 1) * 127.5,
        (cos(phase + 3 * frame + 4 * PI / 3) + 1) * 127.5,
      );
      cell.fg = rgbHex(
        (cos(phase * 0.06 + frame) + 1) * 127.5,
        (cos(phase * 0.07 + 2 * frame + 2 * PI / 3) + 1) * 127.5,
        (cos(phase * 0.08 + 3 * frame + 4 * PI / 3) + 1) * 127.5,
      );
      surface.set(column, row, cell);
    }
  }
}

export function fillHorizon(
  surface: ReturnType<typeof createSurface>,
  model: Model,
): void {
  const halfY = model.rows / 2;
  const halfX = model.cols / 2;
  const speed = model.mouseDown ? -0.3 : 0.3;
  for (let row = 0; row < model.rows; row++) {
    const z = row - halfY;
    for (let column = 0; column < model.cols; column++) {
      if (z === 0) {
        surface.set(column, row, {
          char: '─',
          fg: '#ffffff',
          bg: '#000000',
        });
        continue;
      }
      const value = (column - halfX) / z;
      const code =
        (Math.floor(value + halfX + model.frame * speed) % 94 + 94) % 94 + 33;
      const bright = Math.round(
        clamp(1 - Math.abs(z) / halfY, 0, 1) * 200 + 55,
      );
      surface.set(column, row, {
        char: String.fromCharCode(code),
        fg: rgbHex(bright, bright, bright),
        bg: z < 0
          ? rgbHex(bright * 0.3, bright * 0.4, bright)
          : rgbHex(bright * 0.2, bright * 0.6, bright * 0.2),
      });
    }
  }
}

export function fillNoise(
  surface: ReturnType<typeof createSurface>,
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
      surface.set(column, row, {
        char: PERF_DENSITY[index] ?? ' ',
        fg: rgbHex(
          255 * value * 0.3 + 246 * (1 - value),
          89 * value * 0.3 + 246 * (1 - value),
          55 * value * 0.3 + 244 * (1 - value),
        ),
        bg: '#000000',
      });
    }
  }
}
