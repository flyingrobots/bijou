import type { WritePort } from '@flyingrobots/bijou';

type ErrorWritePort =
  Pick<WritePort, 'write'> & Partial<Pick<WritePort, 'writeError'>>;

export function formatRuntimeDetail(value: unknown): string {
  if (value instanceof Error) return value.stack ?? value.message;
  if (value == null || typeof value !== 'object') return String(value);
  try {
    const serialized: unknown = JSON.stringify(value);
    return typeof serialized === 'string'
      ? serialized
      : Object.prototype.toString.call(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

export function formatModelSnapshot(snapshot: unknown): string {
  try {
    const serialized: unknown = JSON.stringify(snapshot, null, 2);
    return typeof serialized === 'string'
      ? serialized
      : formatRuntimeDetail(snapshot);
  } catch {
    return '[unserializable model snapshot]';
  }
}

export function writeErrorLine(io: ErrorWritePort, data: string): void {
  if (io.writeError != null) {
    io.writeError(data);
  } else {
    io.write(data);
  }
}
