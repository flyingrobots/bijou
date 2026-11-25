// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { BijouContext, Surface } from '@flyingrobots/bijou';

/** What a demo hears. The shell turns terminal input into these; a browser host can send the same. */
export type DemoMsg =
  | { readonly type: 'key'; readonly key: string }
  | { readonly type: 'pointer'; readonly col: number; readonly row: number }
  | { readonly type: 'pointer-leave' }
  | { readonly type: 'pulse'; readonly dt: number }
  /**
   * The demo's pane in cells. The shell sends it before the first pulse and again whenever the pane changes, to every
   * demo, including one that is not showing. A demo that sizes its simulation from the pane keeps that size in its state;
   * one that paints from `view`'s width and height alone ignores it.
   */
  | { readonly type: 'resize'; readonly width: number; readonly height: number };

/** What a demo is told when it paints: the pane, and the clock the session keeps. */
export interface DemoFrame {
  readonly width: number;
  readonly height: number;
  readonly frame: number;
  readonly elapsed: number;
  readonly ctx: BijouContext;
}

/** A demo owns its state `S`. `view` is pure: the same state and frame paint the same Surface. */
export interface Demo<S> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Keys the demo answers to, shown in the shell footer. */
  readonly keys: string;
  /**
   * Whether the demo is taking text. While it is, the shell and the session leave every key to the demo, space
   * included, and `shift` letters arrive as `shift+<letter>`. Only `ctrl+c` still quits.
   */
  readonly captures?: (state: S) => boolean;
  init(seed: number): S;
  update(msg: DemoMsg, state: S): S;
  view(state: S, frame: DemoFrame): Surface;
}

/** A running demo. Immutable: `update` returns the next session. */
export interface Session {
  readonly paused: boolean;
  /** True while the demo is taking text: the shell sends it every key. */
  readonly capturing: boolean;
  readonly frame: number;
  readonly elapsed: number;
  update(msg: DemoMsg): Session;
  view(width: number, height: number, ctx: BijouContext): Surface;
}

/** A demo with its state type erased, so a list can hold demos of different state. */
export interface DemoEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly keys: string;
  mount(seed: number): Session;
}

interface Clock {
  readonly paused: boolean;
  readonly frame: number;
  readonly elapsed: number;
}

function run<S>(demo: Demo<S>, state: S, clock: Clock): Session {
  const capturing = demo.captures?.(state) ?? false;
  return {
    ...clock,
    capturing,
    update(msg) {
      if (msg.type === 'key' && msg.key === 'space' && !capturing) return run(demo, state, { ...clock, paused: !clock.paused });
      if (msg.type === 'pulse') {
        if (clock.paused) return run(demo, state, clock);
        const next = { ...clock, frame: clock.frame + 1, elapsed: clock.elapsed + msg.dt };
        return run(demo, demo.update(msg, state), next);
      }
      return run(demo, demo.update(msg, state), clock);
    },
    view: (width, height, ctx) => demo.view(state, { width, height, ctx, frame: clock.frame, elapsed: clock.elapsed }),
  };
}

/** Space pauses and resumes every demo, unless it is taking text: a paused session drops pulses and still takes keys and the pointer. */
export function defineDemo<S>(demo: Demo<S>): DemoEntry {
  const { id, name, description, keys } = demo;
  return { id, name, description, keys, mount: (seed) => run(demo, demo.init(seed), { paused: false, frame: 0, elapsed: 0 }) };
}
