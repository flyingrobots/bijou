import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from 'node:worker_threads';
import { type BijouContext } from '@flyingrobots/bijou';
import type { App, RunOptions } from '@flyingrobots/bijou-tui';
import { run } from '@flyingrobots/bijou-tui';
import { createNodeContext } from '../index.js';
import { hasBijouWorkerFlag } from './worker-data.js';

export interface WorkerInstance {
  postMessage(message: unknown): void;
  on(event: 'message', handler: (value: MainMessage) => void): void;
  on(event: 'error', handler: (value: Error) => void): void;
  on(event: 'exit', handler: (value: number) => void): void;
  terminate(): Promise<number>;
}
export interface WorkerParentPort {
  on(event: 'message', listener: (msg: unknown) => void): void;
  off(event: 'message', listener: (msg: unknown) => void): void;
  postMessage(message: unknown): void;
}
export interface WorkerThreadBindings {
  isMainThread: boolean;
  parentPort: WorkerParentPort | null;
  workerData: unknown;
  createWorker(entry: string, options: Record<string, unknown>): WorkerInstance;
  createNodeContext(): BijouContext;
  runApp<Model, M>(app: App<Model, M>, options: RunOptions<M>): Promise<void>;
  scheduleTimeout(
    callback: () => void,
    ms: number,
  ): ReturnType<typeof setTimeout>;
}
export function defaultWorkerThreadBindings(): WorkerThreadBindings {
  return {
    isMainThread,
    parentPort,
    workerData,
    createWorker(entry, options) {
      return new Worker(entry, options);
    },
    createNodeContext,
    runApp: run,
    scheduleTimeout(callback, ms) {
      return setTimeout(callback, ms);
    },
  };
}
// ---------------------------------------------------------------------------
// Types & Messages
// ---------------------------------------------------------------------------

export type WorkerMessage =
  | { type: 'io:data'; data: string }
  | { type: 'io:resize'; columns: number; rows: number }
  | { type: 'data'; payload: unknown }
  | { type: 'quit' };
export type MainMessage =
  | { type: 'render:frame'; output: string }
  | { type: 'error'; message: string }
  | { type: 'data'; payload: unknown }
  | { type: 'quit' };
/**
 * Checks if the current environment is running inside a Bijou Worker.
 */
export function isBijouWorker(): boolean {
  const bindings = defaultWorkerThreadBindings();
  return !bindings.isMainThread && hasBijouWorkerFlag(bindings.workerData);
}
/**
 * Sends a custom data message from the worker to the main thread.
 * This will be received via the `onMessage` callback in `runInWorker`.
 */
export function sendToMain(payload: unknown): void {
  const bindings = defaultWorkerThreadBindings();
  if (bindings.parentPort) {
    bindings.parentPort.postMessage({
      type: 'data',
      payload,
    } satisfies MainMessage);
  }
}
