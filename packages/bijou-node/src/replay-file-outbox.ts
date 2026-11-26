import { closeSync, fsyncSync, openSync, writeSync } from 'node:fs';
import {
  ReplayOutboxError,
  createReplayOutbox,
  type ReplayLineSinkPort,
  type ReplayOutbox,
} from '@flyingrobots/bijou';

export interface ReplayFileOutboxOptions {
  /**
   * Replace an existing file. Default `false`: opening a path that exists
   * fails with `open-failed`, so a second session never appends `seq` 0
   * after an earlier stream.
   */
  readonly overwrite?: boolean;
}

/** A file-backed outbox. It keeps no events in memory. */
export interface ReplayFileOutbox extends ReplayOutbox {
  readonly path: string;
}

/**
 * Open `path` and return an outbox that appends one canonical line per event.
 *
 * Each `append()` writes its whole line (ending in `\n`) with synchronous
 * writes and then `fsync`s before it returns, so a crash loses at most the
 * event in flight. A line is whole only when its `\n` is present: an
 * interrupted write can leave at most one unterminated tail, and after any
 * write failure the outbox is `failed` and writes nothing more, so that tail
 * is never followed by another line.
 */
export function createReplayFileOutbox(
  path: string,
  options: ReplayFileOutboxOptions = {},
): ReplayFileOutbox {
  const descriptor = openReplayFile(path, options.overwrite === true);
  const outbox = createReplayOutbox(fileLineSink(descriptor));
  return {
    path,
    append: (event) => outbox.append(event),
    close: () => {
      outbox.close();
    },
    get state() {
      return outbox.state;
    },
    get nextSeq() {
      return outbox.nextSeq;
    },
  };
}

function openReplayFile(path: string, overwrite: boolean): number {
  try {
    return openSync(path, overwrite ? 'w' : 'wx');
  } catch (cause) {
    throw new ReplayOutboxError('open-failed', '$', 'the replay file could not be opened', { cause });
  }
}

function fileLineSink(descriptor: number): ReplayLineSinkPort {
  return {
    writeLine(line: string): void {
      const bytes = Buffer.from(line, 'utf8');
      let written = 0;
      while (written < bytes.length) {
        written += writeSync(descriptor, bytes, written, bytes.length - written);
      }
      fsyncSync(descriptor);
    },
    close(): void {
      closeSync(descriptor);
    },
  };
}
