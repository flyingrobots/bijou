import type { ClockPort, IOPort, RawInputHandle } from '@flyingrobots/bijou';
import { createWebClock } from './clock.js';
import { WebUnsupportedCapabilityError } from './errors.js';

/** Caller-supplied destinations for output. A stream without a sink is buffered in memory. */
export interface WebOutputSinks {
  /** Receives text written to the output stream. */
  readonly write?: (data: string) => void;
  /** Receives text written to the error stream. */
  readonly writeError?: (data: string) => void;
  /**
   * Receives raw output bytes. The view is valid only during the call, because
   * the caller may reuse the underlying buffer; copy it to keep it.
   */
  readonly writeBytes?: (bytes: Uint8Array) => void;
}

/** Options for {@link createWebOutputIO}. */
export interface WebOutputIOOptions extends WebOutputSinks {
  /** Clock that runs `setInterval`. Defaults to {@link createWebClock}. */
  readonly clock?: ClockPort;
  /** Source of resize events. Without one, `onResize` callbacks never run. */
  readonly resize?: (callback: (columns: number, rows: number) => void) => RawInputHandle;
  /** Most characters each in-memory buffer retains. Older text is dropped. Defaults to 1,048,576. */
  readonly bufferLimit?: number;
}

/** An output-only {@link IOPort} for browser hosts, with inspectable buffers. */
export interface WebOutputIO extends IOPort {
  writeBytes(buf: Uint8Array, len: number): void;
  /** Output text that no sink received, oldest first. */
  output(): string;
  /** Error text that no sink received, oldest first. */
  errorOutput(): string;
  /** Empty both in-memory buffers. */
  clear(): void;
}

const DEFAULT_BUFFER_LIMIT = 1_048_576;

function createBuffer(limit: number): { append(data: string): void; read(): string; clear(): void } {
  let text = '';
  return {
    append(data) {
      text += data;
      if (text.length > limit) text = text.slice(text.length - limit);
    },
    read: () => text,
    clear() { text = ''; },
  };
}

/** Whole bytes from zero through the buffer length. A length that is not a number is zero. */
function byteCount(len: number, available: number): number {
  if (Number.isNaN(len)) return 0;
  return Math.min(available, Math.max(0, Math.floor(len)));
}

function joinSegments(left: string, right: string): string {
  if (left === '') return right;
  return `${left.replace(/\/+$/u, '')}/${right.replace(/^\/+/u, '')}`;
}

/**
 * Create the output half of an {@link IOPort} for a browser host.
 *
 * `write`, `writeError`, and `writeBytes` go to the supplied sinks, or to
 * in-memory buffers when there are none. A browser has no filesystem and this
 * port attaches no input, so `readFile`, `readDir`, `question`, and `rawInput`
 * refuse with a {@link WebUnsupportedCapabilityError}.
 *
 * @param options - Sinks, clock, resize source, and buffer limit.
 * @returns The I/O port.
 */
export function createWebOutputIO(options: WebOutputIOOptions = {}): WebOutputIO {
  const limit = Math.max(0, Math.floor(options.bufferLimit ?? DEFAULT_BUFFER_LIMIT));
  const out = createBuffer(limit);
  const err = createBuffer(limit);
  const clock = options.clock ?? createWebClock();
  const decoder = new TextDecoder();
  const write = options.write ?? out.append;
  const writeError = options.writeError ?? err.append;

  return {
    write(data) { write(data); },
    writeError(data) { writeError(data); },
    writeBytes(buf, len) {
      const bytes = buf.subarray(0, byteCount(len, buf.length));
      if (bytes.length === 0) return;
      if (options.writeBytes !== undefined) options.writeBytes(bytes);
      else write(decoder.decode(bytes, { stream: true }));
    },
    output: out.read,
    errorOutput: err.read,
    clear() {
      out.clear();
      err.clear();
    },
    question: () => Promise.reject(new WebUnsupportedCapabilityError(
      'QueryPort.question', 'Collect the answer with a browser input and pass it to the application.',
    )),
    rawInput() {
      throw new WebUnsupportedCapabilityError(
        'InteractivePort.rawInput', 'This port only writes output; attach a browser input adapter for keys.',
      );
    },
    setInterval: (callback, ms) => clock.setInterval(callback, ms),
    readFile() {
      throw new WebUnsupportedCapabilityError(
        'FilePort.readFile', 'Fetch or import the content in the application and pass it in as data.',
      );
    },
    readDir() {
      throw new WebUnsupportedCapabilityError(
        'FilePort.readDir', 'A browser has no directory to list; pass a known list of entries instead.',
      );
    },
    joinPath: (...segments) => segments.filter((segment) => segment !== '').reduce(joinSegments, ''),
    onResize: (callback) => options.resize?.(callback) ?? { dispose: () => undefined },
  };
}
