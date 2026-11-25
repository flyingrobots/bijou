// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { RAYCASTER_MAP, canMoveTo } from './raycaster-map.js';

export interface Sprite {
  readonly x: number;
  readonly y: number;
  /** 0 barrel, 1 monster, 2 treasure. */
  readonly texture: number;
  readonly health: number;
  readonly alive: boolean;
}

/** Everything the game keeps: the player, the level's sprites and the counters the heads-up panel shows. */
export interface RaycasterState {
  readonly playerX: number;
  readonly playerY: number;
  readonly angle: number;
  readonly sprites: readonly Sprite[];
  readonly health: number;
  readonly score: number;
  /** Pulses left on the damage flash, and on the muzzle flash. */
  readonly flash: number;
  readonly shoot: number;
  /** Whether the trigger was already down on the last pulse: a shot fires only on the press. */
  readonly armed: boolean;
  /** Pulses so far: a monster bites on every 35th. */
  readonly tick: number;
  readonly hideUI: boolean;
}

const sprite = (x: number, y: number, texture: number, health: number): Sprite => ({ x, y, texture, health, alive: true });

export function initialGame(): RaycasterState {
  return {
    playerX: 3.5, playerY: 3.5, angle: Math.PI * 0.25, health: 100, score: 0, flash: 0, shoot: 0, armed: false, tick: 0, hideUI: false,
    sprites: [
      sprite(5.5, 5.5, 0, 100), sprite(18.5, 18.5, 0, 100), sprite(5.5, 18.5, 0, 100),
      sprite(10.5, 12.5, 1, 50), sprite(12.5, 3.5, 1, 50), sprite(21.5, 10.5, 1, 50),
      sprite(20.5, 3.5, 2, 100), sprite(3.5, 20.5, 2, 100), sprite(20.5, 20.5, 2, 100),
    ],
  };
}

const MOVE = 0.38;
const TURN = 0.085;

/** Step forward (1) or back (-1) along the facing, sliding along a wall on one axis when the full step is blocked. */
export function walk(state: RaycasterState, direction: number): RaycasterState {
  const { playerX: px, playerY: py } = state;
  const nx = px + Math.cos(state.angle) * MOVE * direction;
  const ny = py + Math.sin(state.angle) * MOVE * direction;
  if (canMoveTo(nx, ny)) return { ...state, playerX: nx, playerY: ny };
  if (canMoveTo(nx, py)) return { ...state, playerX: nx };
  if (canMoveTo(px, ny)) return { ...state, playerY: ny };
  return state;
}

export function turn(state: RaycasterState, direction: number): RaycasterState {
  return { ...state, angle: state.angle + TURN * direction };
}

const distance = (a: { x: number; y: number }, x: number, y: number): number => Math.sqrt((a.x - x) ** 2 + (a.y - y) ** 2);

function blocked(state: RaycasterState, s: Sprite, dist: number): boolean {
  const dx = s.x - state.playerX;
  const dy = s.y - state.playerY;
  for (let i = 1; i < Math.floor(dist * 3.0); i++) {
    const mx = Math.floor(state.playerX + (dx / dist) * (i / 3.0));
    const my = Math.floor(state.playerY + (dy / dist) * (i / 3.0));
    const cell = RAYCASTER_MAP[my]?.[mx];
    if (cell !== undefined && cell !== 0) return true;
  }
  return false;
}

/** The nearest live monster inside a 15 degree cone, within 12 units and in line of sight, or -1. */
function target(state: RaycasterState): number {
  let best = -1;
  let bestDist = Infinity;
  state.sprites.forEach((s, i) => {
    if (s.texture !== 1 || !s.alive || s.health <= 0) return;
    const dist = distance(s, state.playerX, state.playerY);
    let diff = Math.atan2(s.y - state.playerY, s.x - state.playerX) - state.angle;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    if (Math.abs(diff) < 0.22 && dist < 12.0 && !blocked(state, s, dist) && dist < bestDist) {
      best = i;
      bestDist = dist;
    }
  });
  return best;
}

function chase(state: RaycasterState): RaycasterState {
  let { health, flash } = state;
  const sprites = state.sprites.map((s) => {
    if (s.texture !== 1 || !s.alive || s.health <= 0) return s;
    const dx = state.playerX - s.x;
    const dy = state.playerY - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8.0 && dist > 0.8) {
      const nx = s.x + (dx / dist) * 0.035;
      const ny = s.y + (dy / dist) * 0.035;
      return canMoveTo(nx, ny) ? { ...s, x: nx, y: ny } : s;
    }
    if (dist <= 0.8 && state.tick % 35 === 0) {
      health = Math.max(0, health - 10);
      flash = 4;
    }
    return s;
  });
  return { ...state, sprites, health, flash };
}

function collect(state: RaycasterState): RaycasterState {
  let { score, health } = state;
  const sprites = state.sprites.map((s) => {
    if (s.texture !== 2 || !s.alive || distance(s, state.playerX, state.playerY) >= 0.65) return s;
    score += 250;
    health = Math.min(100, health + 15);
    return { ...s, alive: false };
  });
  return { ...state, sprites, score, health };
}

function fire(state: RaycasterState): RaycasterState {
  const hit = target(state);
  const victim = state.sprites[hit];
  if (victim === undefined) return state;
  const health = victim.health - 25;
  const sprites = state.sprites.map((s, i) => (i === hit ? { ...s, health, alive: health > 0 } : s));
  return { ...state, sprites, score: state.score + (health > 0 ? 0 : 150) };
}

/** One pulse of the game: the muzzle flash ebbs, monsters chase and bite, treasure is picked up, a fresh trigger press fires. */
export function pulseGame(state: RaycasterState): RaycasterState {
  const shoot = Math.max(0, state.shoot - 1);
  const ticked = { ...state, shoot, tick: state.tick + 1 };
  const moved = collect(chase(ticked));
  const firing = shoot > 0;
  const shot = firing && !moved.armed && moved.health > 0 ? fire(moved) : moved;
  return { ...shot, flash: Math.max(0, shot.flash - 1), armed: firing };
}
