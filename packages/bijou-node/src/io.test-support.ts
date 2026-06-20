export function capturedWriter(): { write(data: string | Uint8Array): true; text(): string } {
  const chunks: (string | Uint8Array)[] = [];
  return {
    write(data: string | Uint8Array): true {
      chunks.push(data);
      return true;
    },
    text(): string {
      return chunks.map((chunk) => typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8')).join('');
    },
  };
}
