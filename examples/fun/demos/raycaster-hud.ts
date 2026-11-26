// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { boxSurface, type BijouContext, type Surface } from '@flyingrobots/bijou';
import { stampPanel } from '../panel.js';
import type { RaycasterState } from './raycaster-game.js';

const GUN = [
  '         [||||]         ',
  '        / █▀▀█ \\        ',
  '       |  █▄▄█  |       ',
  '       |   ||   |       ',
  '       |   ||   |       ',
  '       /   ██   \\       ',
  '      /   █  █   \\      ',
  '     |   █    █   |     ',
];
const MUZZLE = ['      *  *  ^  *  *      ', '    *   \\  |  /   *    ', '   * --  (@@@)  -- *   ', '    *   /  |  \\   *    '];

function stamp(surface: Surface, lines: readonly string[], x: number, y: number, colour: (char: string) => readonly [number, number, number]): void {
  lines.forEach((row, dy) => {
    Array.from(row).forEach((char, dx) => {
      const tx = x + dx;
      const ty = y + dy;
      if (char === ' ' || tx < 0 || tx >= surface.width || ty < 0 || ty >= surface.height) return;
      const [r, g, b] = colour(char);
      surface.setRGB(tx, ty, char, r, g, b, 0, 0, 0);
    });
  });
}

/** Tint every cell blood red, for a pulse or two after a bite. */
export function flashRed(surface: Surface): void {
  for (let y = 0; y < surface.height; y++) {
    for (let x = 0; x < surface.width; x++) {
      const cell = surface.get(x, y);
      const fg = cell.fgRGB ?? [0, 0, 0];
      const bg = cell.bgRGB ?? [0, 0, 0];
      surface.setRGB(x, y, cell.char, Math.min(255, fg[0] + 100), Math.max(0, fg[1] - 50), Math.max(0, fg[2] - 50),
        Math.min(255, bg[0] + 40), Math.max(0, bg[1] - 20), Math.max(0, bg[2] - 20));
    }
  }
}

/** The gun at the bottom, bobbing faster once the player has walked, with a muzzle flash while firing; or the game-over card. */
export function paintWeapon(surface: Surface, state: RaycasterState, elapsed: number, ctx: BijouContext): void {
  const { width, height } = surface;
  if (state.health <= 0) {
    const text = [
      '  ██████  █████  ███    ███ ███████      ██████  ██    ██ ███████ ██████   ',
      ' ██      ██   ██ ████  ████ ██          ██    ██ ██    ██ ██      ██   ██  ',
      ' ██   ██ ███████ ██ ████ ██ █████       ██    ██ ██    ██ █████   ██████   ',
      ' ██    ██ ██   ██ ██  ██  ██ ██          ██    ██  ██  ██  ██      ██   ██  ',
      '  ██████  ██   ██ ██      ██ ███████      ██████    ████   ███████ ██   ██  ',
      '',
      '                         Press [R] to restart the level                    ',
    ].join('\n');
    surface.blit(boxSurface(text, { width: 76, ctx }), Math.floor((width - 76) / 2), Math.floor((height - 9) / 2));
    return;
  }
  const moving = Math.abs(state.playerX - 3.5) > 0.05;
  const bob = moving ? elapsed * 10 : elapsed * 2.5;
  const bobX = Math.floor(Math.sin(bob) * (moving ? 4.5 : 1.2));
  const bobY = Math.floor(Math.abs(Math.cos(bob)) * (moving ? 1.5 : 0.4));
  const gunX = Math.floor((width - 24) / 2) + bobX;
  const gunY = height - 8 - 1 + bobY;
  if (state.shoot > 0) stamp(surface, MUZZLE, gunX, gunY - 4, () => [255, 200, 30]);
  stamp(surface, GUN, gunX, gunY, (c) => (c === '█' || c === '|' ? [80, 80, 90] : c === '[' ? [150, 150, 160] : [100, 100, 110]));
  surface.setRGB(Math.floor(width / 2), Math.floor(height / 2), '+', 0, 255, 0, 0, 0, 0);
}

export function stampHud(surface: Surface, state: RaycasterState, ctx: BijouContext): void {
  if (state.hideUI) return;
  const monsters = state.sprites.filter((s) => s.texture === 1 && s.alive).length;
  stampPanel(surface, [
    '  ***  RETRO 3D RAYCASTER HUD  ***    ',
    '─'.repeat(36),
    `  Health:      ${state.health > 0 ? `${String(state.health)}%` : 'DEAD'}`,
    `  Score:       ${String(state.score)}`,
    `  Monsters:    ${String(monsters)} remaining`,
    `  X: ${state.playerX.toFixed(2)}  Y: ${state.playerY.toFixed(2)}  A: ${((state.angle * 180) / Math.PI).toFixed(0)}°`,
    '─'.repeat(36),
    '  Controls:                           ',
    '  - W / S         : Walk              ',
    '  - A / D         : Turn              ',
    '  - [F] / [P]     : Shoot Weapon      ',
    '  - [R]           : Restart Level     ',
    '  - [H]           : Hide this panel   ',
  ], ctx, (free) => ({ x: Math.max(0, free.x - 4), y: Math.max(0, Math.min(3, free.y - 1)) }));
}
