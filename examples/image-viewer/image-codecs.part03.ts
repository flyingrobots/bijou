import type { RgbaFrame } from '../../packages/bijou-tui/src/index.js';
import { isPng } from './image-codecs.part01.js';
import type { DecodedImage, NetpbmCursor } from './image-codecs.part01.js';
import { decodePngRgba, isNetpbmWhitespace, readNetpbmToken, startsWithNetpbmMagic } from './image-codecs.part02.js';

function readPositiveNetpbmInteger(buffer: Buffer, cursor: NetpbmCursor, label: string): number {
  const value = Number(readNetpbmToken(buffer, cursor));
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`PPM decoder expected a positive ${label}.`);
  }
  return value;
}

function scaleNetpbmSample(value: number, maxValue: number): number {
  return Math.max(0, Math.min(255, Math.round((value / maxValue) * 255)));
}

function readNetpbmSample(
  buffer: Buffer,
  cursor: NetpbmCursor,
  label: string,
  maxValue: number,
): number {
  const value = Number(readNetpbmToken(buffer, cursor));
  if (!Number.isSafeInteger(value) || value < 0 || value > maxValue) {
    throw new Error(`PPM decoder expected ${label} to be between 0 and ${String(maxValue)}.`);
  }
  return value;
}

function decodeP3Pixels(
  buffer: Buffer,
  cursor: NetpbmCursor,
  width: number,
  height: number,
  maxValue: number,
): RgbaFrame {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel++) {
    const target = pixel * 4;
    rgba[target] = scaleNetpbmSample(readNetpbmSample(buffer, cursor, 'red', maxValue), maxValue);
    rgba[target + 1] = scaleNetpbmSample(readNetpbmSample(buffer, cursor, 'green', maxValue), maxValue);
    rgba[target + 2] = scaleNetpbmSample(readNetpbmSample(buffer, cursor, 'blue', maxValue), maxValue);
    rgba[target + 3] = 255;
  }
  return { width, height, data: rgba };
}

function consumeNetpbmBinarySeparator(buffer: Buffer, cursor: NetpbmCursor): void {
  if (cursor.offset >= buffer.length || !isNetpbmWhitespace(buffer[cursor.offset] ?? 0)) {
    throw new Error('PPM decoder expected binary pixel data separator.');
  }

  if (buffer[cursor.offset] === 0x0d && buffer[cursor.offset + 1] === 0x0a) {
    cursor.offset += 2;
    return;
  }

  cursor.offset++;
}

function readNetpbmBinarySample(value: number, label: string, maxValue: number): number {
  if (value > maxValue) {
    throw new Error(`PPM decoder expected ${label} to be between 0 and ${String(maxValue)}.`);
  }
  return value;
}

function decodeP6Pixels(
  buffer: Buffer,
  cursor: NetpbmCursor,
  width: number,
  height: number,
  maxValue: number,
): RgbaFrame {
  consumeNetpbmBinarySeparator(buffer, cursor);
  const sourceLength = width * height * 3;
  if (cursor.offset + sourceLength > buffer.length) {
    throw new Error('PPM decoder found truncated binary pixel data.');
  }

  const rgba = new Uint8ClampedArray(width * height * 4);
  let source = cursor.offset;
  for (let pixel = 0; pixel < width * height; pixel++) {
    const target = pixel * 4;
    rgba[target] = scaleNetpbmSample(readNetpbmBinarySample(buffer[source++] ?? 0, 'red', maxValue), maxValue);
    rgba[target + 1] = scaleNetpbmSample(readNetpbmBinarySample(buffer[source++] ?? 0, 'green', maxValue), maxValue);
    rgba[target + 2] = scaleNetpbmSample(readNetpbmBinarySample(buffer[source++] ?? 0, 'blue', maxValue), maxValue);
    rgba[target + 3] = 255;
  }
  return { width, height, data: rgba };
}

export function decodePpmRgba(input: Uint8Array): RgbaFrame {
  const buffer = Buffer.from(input);
  const cursor: NetpbmCursor = { offset: 0 };
  const magic = readNetpbmToken(buffer, cursor);
  if (magic !== 'P3' && magic !== 'P6') {
    throw new Error('PPM decoder supports only P3 and P6 RGB images.');
  }

  const width = readPositiveNetpbmInteger(buffer, cursor, 'width');
  const height = readPositiveNetpbmInteger(buffer, cursor, 'height');
  const maxValue = readPositiveNetpbmInteger(buffer, cursor, 'max value');
  if (maxValue > 255) {
    throw new Error('PPM decoder supports only max values up to 255.');
  }

  return magic === 'P3'
    ? decodeP3Pixels(buffer, cursor, width, height, maxValue)
    : decodeP6Pixels(buffer, cursor, width, height, maxValue);
}

export function decodeImageRgba(input: Uint8Array, filename = 'image'): DecodedImage {
  if (isPng(input)) {
    return { format: 'png', frame: decodePngRgba(input) };
  }

  const lower = filename.toLowerCase();
  if (lower.endsWith('.ppm') || lower.endsWith('.pnm') || startsWithNetpbmMagic(input)) {
    return { format: 'ppm', frame: decodePpmRgba(input) };
  }

  throw new Error('Image viewer supports SVG, PNG, and PPM/PNM images.');
}
