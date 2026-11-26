// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import { createSurface } from '@flyingrobots/bijou';
import { defineDemo, type Demo } from '../contract.js';
import { initialGame, pulseGame, turn, walk, type RaycasterState } from './raycaster-game.js';
import { flashRed, paintWeapon, stampHud } from './raycaster-hud.js';
import { paintSprites } from './raycaster-sprites.js';
import { cameraOf, paintWalls } from './raycaster-walls.js';

export type { RaycasterState } from './raycaster-game.js';

/** A first-person game on a 24 by 24 map. Movement, collision, monsters and shooting are all this demo's own update. */
export const raycaster: Demo<RaycasterState> = {
  id: 'raycaster',
  name: 'Retro 3D Raycaster',
  description: 'First-person raycaster game: walk a maze, collect gold, shoot monsters',
  keys: 'w s walk, a d turn, f shoot, r restart, h hides the panel, space pause',
  init: initialGame,
  update(msg, state) {
    if (msg.type === 'pulse') return pulseGame(state);
    if (msg.type !== 'key') return state;
    switch (msg.key) {
      case 'w': case 'up': return walk(state, 1);
      case 's': case 'down': return walk(state, -1);
      case 'a': return turn(state, -1);
      case 'd': return turn(state, 1);
      case 'f': case 'p': return { ...state, shoot: 6 };
      case 'r': return { ...initialGame(), hideUI: state.hideUI };
      case 'h': return { ...state, hideUI: !state.hideUI };
      default: return state;
    }
  },
  view(state, { width, height, elapsed, ctx }) {
    const surface = createSurface(width, height);
    const cam = cameraOf(state.playerX, state.playerY, state.angle);
    paintSprites(surface, cam, paintWalls(surface, cam), state.sprites);
    if (state.flash > 0 && state.health > 0) flashRed(surface);
    paintWeapon(surface, state, elapsed, ctx);
    stampHud(surface, state, ctx);
    return surface;
  },
};

export const raycasterDemo = defineDemo(raycaster);
