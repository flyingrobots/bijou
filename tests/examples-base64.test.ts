import { describe, expect, it } from 'vitest';
import { decodeCanonicalBase64 } from '../examples/_shared/base64.js';

// The example raster fonts decoded their masks with Buffer and refused any
// text that Buffer would not encode back unchanged. The host-free decoder
// must accept and refuse exactly the same texts.
function bufferDecode(text: string): Uint8Array | undefined {
  const bytes = Buffer.from(text, 'base64');
  return bytes.toString('base64') === text ? new Uint8Array(bytes) : undefined;
}

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2 ** 31;
    return state;
  };
}

describe('decodeCanonicalBase64', () => {
  it('decodes what Buffer encodes, for every length from 0 to 64 bytes', () => {
    const next = seeded(809);
    for (let length = 0; length <= 64; length++) {
      const bytes = Uint8Array.from({ length }, () => next() % 256);
      const text = Buffer.from(bytes).toString('base64');
      expect(decodeCanonicalBase64(text)).toEqual(bytes);
    }
  });

  it.each(['A', 'AB', 'AB=', 'AB==A', 'AAB=', 'QR==', 'Zm9v YmFy', 'Zm9v\n', 'Zm9-', 'Zm9_', '====', 'Zg', 'Zg='])(
    'refuses %j as Buffer does',
    (text) => {
      expect(bufferDecode(text)).toBeUndefined();
      expect(decodeCanonicalBase64(text)).toBeUndefined();
    },
  );

  it('agrees with Buffer on random texts over the alphabet and padding', () => {
    const next = seeded(797);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    for (let round = 0; round < 2_000; round++) {
      const text = Array.from({ length: next() % 13 }, () => alphabet.charAt(next() % alphabet.length)).join('');
      expect(decodeCanonicalBase64(text)).toEqual(bufferDecode(text));
    }
  });
});
