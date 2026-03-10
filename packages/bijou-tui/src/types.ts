/**
 * Core type definitions for the bijou-tui framework.
 *
 * Define the message types (key, resize, mouse), TEA application interface,
 * command abstraction, and runtime options used throughout bijou-tui.
 *
 * @module
 */

import type { BijouContext, Surface } from '@flyingrobots/bijou';
import type { Middleware } from './eventbus.js';

// --- Messages ---

/** Represent a keyboard input event with key name and modifier flags. */
export interface KeyMsg {
  /** Discriminant tag identifying this as a keyboard message. */
  readonly type: 'key';
  /** Key name (e.g. `"a"`, `"enter"`, `"up"`, `"space"`). */
  readonly key: string;
  /** Whether the Ctrl modifier was held. */
  readonly ctrl: boolean;
  /** Whether the Alt/Option modifier was held. */
  readonly alt: boolean;
  /** Whether the Shift modifier was held. */
  readonly shift: boolean;
}

/** Represent a terminal resize event with new dimensions. */
export interface ResizeMsg {
  /** Discriminant tag identifying this as a resize message. */
  readonly type: 'resize';
  /** New terminal width in columns. */
  readonly columns: number;
  /** New terminal height in rows. */
  readonly rows: number;
}

/** Represent a system animation pulse event. */
export interface PulseMsg {
  /** Discriminant tag identifying this as a pulse message. */
  readonly type: 'pulse';
  /** Time delta in seconds since the last pulse. */
  readonly dt: number;
}

// --- Mouse messages ---

/** Mouse button identifier. `"none"` is used for scroll and motion events without a button. */
export type MouseButton = 'left' | 'middle' | 'right' | 'none';

/** Mouse action type including press, release, move, and scroll directions. */
export type MouseAction = 'press' | 'release' | 'move' | 'scroll-up' | 'scroll-down';

/** Represent a mouse input event with button, action, position, and modifiers. */
export interface MouseMsg {
  /** Discriminant tag identifying this as a mouse message. */
  readonly type: 'mouse';
  /** Which mouse button is involved (or `"none"` for scroll/motion). */
  readonly button: MouseButton;
  /** The mouse action performed. */
  readonly action: MouseAction;
  /** 0-based column position. */
  readonly col: number;
  /** 0-based row position. */
  readonly row: number;
  /** Whether the Shift modifier was held. */
  readonly shift: boolean;
  /** Whether the Alt/Option modifier was held. */
  readonly alt: boolean;
  /** Whether the Ctrl modifier was held. */
  readonly ctrl: boolean;
}

// --- Type guards ---

/**
 * Narrow an unknown message to {@link KeyMsg}.
 *
 * @param msg - Value to test.
 * @returns `true` if `msg` is a `KeyMsg`.
 */
export function isKeyMsg(msg: unknown): msg is KeyMsg {
  return typeof msg === 'object' && msg !== null && 'type' in msg && (msg as KeyMsg).type === 'key';
}

/**
 * Narrow an unknown message to {@link ResizeMsg}.
 *
 * @param msg - Value to test.
 * @returns `true` if `msg` is a `ResizeMsg`.
 */
export function isResizeMsg(msg: unknown): msg is ResizeMsg {
  return typeof msg === 'object' && msg !== null && 'type' in msg && (msg as ResizeMsg).type === 'resize';
}

/**
 * Narrow an unknown message to {@link PulseMsg}.
 *
 * @param msg - Value to test.
 * @returns `true` if `msg` is a `PulseMsg`.
 */
export function isPulseMsg(msg: unknown): msg is PulseMsg {
  return typeof msg === 'object' && msg !== null && 'type' in msg && (msg as PulseMsg).type === 'pulse';
}

/**
 * Narrow an unknown message to {@link MouseMsg}.
 *
 * @param msg - Value to test.
 * @returns `true` if `msg` is a `MouseMsg`.
 */
export function isMouseMsg(msg: unknown): msg is MouseMsg {
  return typeof msg === 'object' && msg !== null && 'type' in msg && (msg as MouseMsg).type === 'mouse';
}

// --- Commands ---

/** Sentinel symbol signaling that the application should quit. */
export const QUIT: unique symbol = Symbol('QUIT');

/** The type of the {@link QUIT} sentinel symbol. */
export type QuitSignal = typeof QUIT;

/**
 * A side-effect function that can emit messages back to the application.
 *
 * Receive an `emit` callback for dispatching intermediate messages during
 * execution. Resolve to a final message, a {@link QuitSignal}, or `void`.
 *
 * @template M - Application message type.
 */
export type Cmd<M> = (emit: (msg: M) => void, capabilities: CmdCapabilities) => Promise<M | QuitSignal | void>;

/** Capabilities provided to commands by the runtime. */
export interface CmdCapabilities {
  /** 
   * Subscribe to the system animation pulse. 
   * Returns a dispose function.
   */
  onPulse(handler: (dt: number) => void): { dispose(): void };
}

// --- App definition ---

/**
 * TEA (The Elm Architecture) application interface.
 *
 * Define the three core functions: `init` for initial state, `update` for
 * state transitions, and `view` for rendering.
 *
 * @template Model - Application state type.
 * @template M - Custom application message type (defaults to `never`).
 */
export interface App<Model, M = never> {
  /**
   * Return the initial model and startup commands.
   *
   * @returns A tuple of `[initialModel, startupCommands]`.
   */
  init(): [Model, Cmd<M>[]];

  /**
   * Handle a message and return the updated model with commands.
   *
   * @param msg - Incoming message (key, resize, mouse, pulse, or custom).
   * @param model - Current application state.
   * @returns A tuple of `[updatedModel, commands]`.
   */
  update(msg: KeyMsg | ResizeMsg | MouseMsg | PulseMsg | M, model: Model): [Model, Cmd<M>[]];

  /**
   * Render the current model as a Surface for terminal display.
   *
   * @param model - Current application state.
   * @returns Rendered Surface.
   */
  view(model: Model): Surface;
}

// --- Runtime options ---

/**
 * Configuration options for the TEA runtime.
 * 
 * @template M - Custom application message type.
 */
export interface RunOptions<M = any> {
  /** Enter the alternate screen buffer on startup. */
  altScreen?: boolean;
  /** Hide the cursor on startup. */
  hideCursor?: boolean;
  /** Enable mouse input (SGR mode). Default: false. */
  mouse?: boolean;
  /** Bijou context providing I/O and runtime ports. */
  ctx?: BijouContext;
  /** Optional middleware to intercept or modify messages. */
  middlewares?: Middleware<M>[];
  /** Optional BCSS stylesheet string. */
  css?: string;
}
