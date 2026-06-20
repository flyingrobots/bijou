import { EventEmitter } from 'node:events';
import type { NodeWriteStream } from './io-types.js';

class ReadlineOutputAdapter extends EventEmitter implements NodeJS.WritableStream {
  readonly writable = true;

  constructor(private readonly writer: NodeWriteStream) {
    super();
  }

  write(buffer: Uint8Array | string): boolean;
  write(str: string, encoding?: BufferEncoding): boolean;
  write(buffer: Uint8Array | string): boolean {
    const result = this.writer.write(buffer);
    return typeof result === 'boolean' ? result : true;
  }

  end(): this {
    return this;
  }
}

export function createReadlineOutput(writer: NodeWriteStream): NodeJS.WritableStream {
  return new ReadlineOutputAdapter(writer);
}
