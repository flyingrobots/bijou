import { open } from 'node:fs/promises';

/** Read at most limit+1 bytes, including files that grow during the read. */
export async function readBoundedFile(path: string | URL, limit: number): Promise<Uint8Array> {
  const file = await open(path, 'r');
  try {
    if (!(await file.stat()).isFile()) throw new Error('Expected a regular file.');
    const buffer = Buffer.alloc(limit + 1);
    let used = 0;
    while (used < buffer.length) {
      const { bytesRead } = await file.read(buffer, used, buffer.length - used, used);
      if (bytesRead === 0) break;
      used += bytesRead;
    }
    if (used > limit) throw new Error(`File exceeds the ${String(limit)}-byte limit.`);
    return buffer.subarray(0, used);
  } finally {
    await file.close();
  }
}
