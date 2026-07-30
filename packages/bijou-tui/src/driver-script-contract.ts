import type { Surface } from '@flyingrobots/bijou';
import type {
  MouseButton,
  MouseMsg,
  RunOptions,
} from './types.js';

/** A single step in a scripted interaction sequence. */
export type ScriptStep<M = never> =
  | {
    /** Key to send as a raw terminal key string. */
    key: string;
    /** Milliseconds to wait before sending this step. Default: 0. */
    delay?: number;
  }
  | {
    /** Resize event to emit. */
    resize: { columns: number; rows: number };
    /** Milliseconds to wait before sending this step. Default: 0. */
    delay?: number;
  }
  | {
    /** Pulse event to emit. */
    pulse: { dt: number };
    /** Milliseconds to wait before sending this step. Default: 0. */
    delay?: number;
  }
  | {
    /** Mouse event to emit. */
    mouse: MouseMsg;
    /** Milliseconds to wait before sending this step. Default: 0. */
    delay?: number;
  }
  | {
    /** Custom message to emit directly onto the bus. */
    msg: M;
    /** Milliseconds to wait before sending this step. Default: 0. */
    delay?: number;
  };

/** Script step variant carrying a mouse message. */
export type MouseScriptStep<M = never> =
  Extract<ScriptStep<M>, { mouse: MouseMsg }>;

/** Shared modifier and delay options for scripted mouse helpers. */
export interface MouseScriptStepOptions {
  /** Milliseconds to wait before sending this step. Default: 0. */
  readonly delay?: number;
  /** Whether the Shift modifier was held. Default: false. */
  readonly shift?: boolean;
  /** Whether the Alt/Option modifier was held. Default: false. */
  readonly alt?: boolean;
  /** Whether the Ctrl modifier was held. Default: false. */
  readonly ctrl?: boolean;
}

/** Options for a scripted mouse-move step. */
export interface MouseMoveStepOptions extends MouseScriptStepOptions {
  /** Button carried by the movement event. Default: "none". */
  readonly button?: MouseButton;
}

/** Direction for scripted wheel steps. */
export type MouseWheelDirection = 'up' | 'down';

/** Options for a scripted run, extending the base runtime options. */
export interface RunScriptOptions extends RunOptions {
  /** Capture each rendered frame. */
  onFrame?: (frame: Surface, index: number) => void;
  /** Pulse frequency used to drive animation commands, or false to disable. */
  pulseFps?: number | false;
}

/** Result returned after all scripted steps have been processed. */
export interface RunScriptResult<Model> {
  /** Final model state after all steps. */
  model: Model;
  /** All rendered frames in order. */
  frames: Surface[];
  /** Total elapsed time in milliseconds. */
  elapsed: number;
}
