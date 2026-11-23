// Canonical base64 (RFC 4648 section 4, padded), with no host API, so the
// raster fonts that store coverage masks this way load in any host.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const SHAPE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;

function encode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const n = (a << 16) | (b << 8) | c;
    out += ALPHABET.charAt((n >> 18) & 63) + ALPHABET.charAt((n >> 12) & 63);
    out += i + 1 < bytes.length ? ALPHABET.charAt((n >> 6) & 63) : '=';
    out += i + 2 < bytes.length ? ALPHABET.charAt(n & 63) : '=';
  }
  return out;
}

/**
 * The bytes `text` encodes, or `undefined` unless `text` is the one canonical
 * encoding of them: what `Buffer.from(text, 'base64')` decodes and
 * `toString('base64')` gives back unchanged.
 */
export function decodeCanonicalBase64(text: string): Uint8Array | undefined {
  if (!SHAPE.test(text)) return undefined;
  const digits = text.replace(/=+$/u, '');
  const bytes = new Uint8Array(Math.floor(digits.length * 3 / 4));
  let bits = 0;
  let value = 0;
  let at = 0;
  for (const digit of digits) {
    value = (value << 6) | ALPHABET.indexOf(digit);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[at++] = (value >> bits) & 0xff;
    }
  }
  return encode(bytes) === text ? bytes : undefined;
}
