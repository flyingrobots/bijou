import { describe, expect, it } from 'vitest';
import { initial, point, pulse, smash, type ShatterState } from '../examples/fun/demos/shatter-phase.js';
import { assemble, step, type Sim } from '../examples/fun/demos/shatter-sim.js';

const DT = 1 / 60;

function run(sim: Sim, pulses: number): Sim {
  let next = sim;
  for (let f = 0; f < pulses; f += 1) next = step(next, DT, f, null)[0];
  return next;
}

const cellsOf = (sim: Sim): string[] =>
  Array.from({ length: sim.x.length }, (_, i) => `${String(sim.x[i])},${String(sim.y[i])},${String(sim.rest[i])}`);

describe('shatter debris', () => {
  it('a dropped column comes to rest on the floor, one glyph per cell, and stays there', () => {
    const column = Array.from({ length: 6 }, (_, k) => [5, k] as const);
    const landed = run(assemble(column, 12, 12), 600);
    expect([...landed.rest]).toEqual([1, 1, 1, 1, 1, 1]);
    expect(new Set(Array.from({ length: 6 }, (_, i) => `${String(landed.x[i])},${String(landed.y[i])}`)).size).toBe(6);
    expect(Math.max(...landed.y)).toBe(11);
    expect(cellsOf(run(landed, 300))).toEqual(cellsOf(landed));
  });

  it('once nothing pushes it, every glyph comes to rest and none keeps climbing', () => {
    let s: ShatterState = smash({ ...initial(7, 100, 30), auto: false });
    for (let f = 0; f < 400; f += 1) {
      if (f > 200) s = point(s, { col: 20 + ((f * 3) % 60), row: 26 + (f % 3) });
      s = pulse(s, DT);
    }
    for (let f = 0; f < 900; f += 1) s = pulse(s, DT);
    const sim = s.sim;
    if (sim === null) throw new Error('expected debris');
    const airborne = [...sim.rest].filter((r) => r === 0).length;
    expect(airborne).toBe(0);
  });
});
