import { describe, expect, it } from 'vitest';
import { raycaster, type RaycasterState } from '../examples/fun/demos/raycaster.js';
import { canMoveTo } from '../examples/fun/demos/raycaster-map.js';
import type { DemoMsg } from '../examples/fun/contract.js';
import { DT, lcg } from './helpers/fun-demos.js';
import { keyMsgs, repeatKey } from './helpers/fun-3d.js';

const run = (state: RaycasterState, msgs: readonly DemoMsg[]): RaycasterState => msgs.reduce((s, msg) => raycaster.update(msg, s), state);
const pulse: DemoMsg = { type: 'pulse', dt: DT };
const monsters = (s: RaycasterState): number => s.sprites.filter((sprite) => sprite.texture === 1 && sprite.alive).length;

describe('the raycaster walks, turns and collides inside its own update', () => {
  it('starts at 3.5, 3.5 facing a quarter pi with full health', () => {
    const s = raycaster.init(1);
    expect([s.playerX, s.playerY, s.angle, s.health, s.score, monsters(s)]).toEqual([3.5, 3.5, Math.PI * 0.25, 100, 0, 3]);
  });

  it('a scripted walk ends at a known position: three steps, a turn of two, three more', () => {
    const end = run(raycaster.init(1), keyMsgs('w', 'w', 'w', 'd', 'd', 'w', 'w', 'w', 's'));
    expect(end.angle).toBeCloseTo(Math.PI * 0.25 + 2 * 0.085, 12);
    expect([end.playerX, end.playerY].map((v) => Number(v.toFixed(6)))).toEqual([4.744837, 4.926675]);
  });

  it('walking into a wall stops at the wall and the player never stands inside it', () => {
    const end = run(raycaster.init(1), repeatKey('w', 40));
    expect(canMoveTo(end.playerX, end.playerY)).toBe(true);
    expect(end.playerX).toBeLessThan(6 - 0.22);
    expect(end.playerY).toBeLessThan(6 - 0.22);
    expect(run(end, keyMsgs('w'))).toEqual(end);
  });

  it('walking along a wall slides instead of stopping dead', () => {
    const faceEast = run(raycaster.init(1), repeatKey('a', 9));
    const wall = run(faceEast, repeatKey('w', 30));
    const slid = run(wall, repeatKey('w', 5));
    expect(canMoveTo(slid.playerX, slid.playerY)).toBe(true);
    expect(slid.playerY).toBeGreaterThan(wall.playerY);
  });

  it('collision holds with no frame ever painted, and w and s walk the same line', () => {
    const state = run(raycaster.init(1), repeatKey('w', 200));
    expect(canMoveTo(state.playerX, state.playerY)).toBe(true);
    const back = run(raycaster.init(1), [...keyMsgs('w'), ...keyMsgs('s')]);
    expect([back.playerX, back.playerY].map((v) => Number(v.toFixed(9)))).toEqual([3.5, 3.5]);
  });

  it('a seeded walk of 2,000 steps never enters a wall and never leaves the map', () => {
    const random = lcg(890);
    const choices = ['w', 'w', 'w', 's', 'a', 'd', 'up', 'down', 'f'];
    let state = raycaster.init(890);
    for (let i = 0; i < 2000; i += 1) {
      const key = choices[Math.floor(random() * choices.length)] ?? 'w';
      state = run(state, [{ type: 'key', key }, pulse]);
      expect(canMoveTo(state.playerX, state.playerY) || state.health === 0).toBe(true);
    }
    expect(state.tick).toBe(2000);
  });
});

describe('the raycaster plays', () => {
  const near = (s: RaycasterState): RaycasterState => ({ ...s, playerX: 12.5, playerY: 5.5, angle: -Math.PI / 2 });

  it('shoots a monster in the firing cone dead in two shots and scores 150', () => {
    let s = near(raycaster.init(1));
    for (let shot = 0; shot < 2; shot += 1) s = run(s, [...keyMsgs('f'), ...Array.from({ length: 8 }, () => pulse)]);
    expect([monsters(s), s.score]).toEqual([2, 150]);
  });

  it('a shot at nothing hurts nobody, and r restarts the level', () => {
    const s = run(raycaster.init(1), [...keyMsgs('f'), pulse, ...keyMsgs('w', 'd')]);
    expect(monsters(s)).toBe(3);
    expect(run(s, keyMsgs('r'))).toEqual(raycaster.init(1));
  });

  it('collects treasure for 250 points and takes damage from a monster that touches the player', () => {
    const cup = run({ ...raycaster.init(1), playerX: 20.5, playerY: 3.7 }, [pulse]);
    expect(cup.score).toBe(250);
    const bitten = run({ ...raycaster.init(1), playerX: 12.5, playerY: 4.0, tick: 34 }, [pulse]);
    expect(bitten.health).toBe(90);
  });
});
