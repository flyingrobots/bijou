import { inflateSync } from 'node:zlib';
import type { RgbaFrame } from '../../packages/bijou-tui/src/index.js';

export type DecodedImageFormat = 'png' | 'ppm';

export interface DecodedImage {
  readonly format: DecodedImageFormat;
  readonly frame: RgbaFrame;
}

interface PngHeader {
  readonly width: number;
  readonly height: number;
  readonly bitDepth: number;
  readonly colorType: number;
  readonly compression: number;
  readonly filter: number;
  readonly interlace: number;
}

interface NetpbmCursor {
  offset: number;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

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

export function decodePngRgba(input: Uint8Array): RgbaFrame {
  const buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  if (!isPng(buffer)) {
    throw new Error('PNG decoder expected a PNG signature.');
  }

  let offset = PNG_SIGNATURE.length;
  let header: PngHeader | undefined;
  const idatChunks: Buffer[] = [];

  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) {
      throw new Error('PNG decoder found a truncated chunk header.');
    }

    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const nextOffset = dataEnd + 4;
    if (nextOffset > buffer.length) {
      throw new Error(`PNG decoder found a truncated ${type} chunk.`);
    }

    const data = buffer.subarray(dataStart, dataEnd);
    if (type === 'IHDR') {
      header = readPngHeader(data);
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }

    offset = nextOffset;
  }

  if (header === undefined) {
    throw new Error('PNG decoder did not find an IHDR chunk.');
  }
  if (idatChunks.length === 0) {
    throw new Error('PNG decoder did not find IDAT data.');
  }

  validateSupportedPngHeader(header);
  const bytesPerPixel = header.colorType === 6 ? 4 : 3;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  return {
    width: header.width,
    height: header.height,
    data: unpackPngScanlines(inflated, header.width, header.height, bytesPerPixel),
  };
}

export function decodePpmRgba(input: Uint8Array): RgbaFrame {
  const buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
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

function isPng(input: Uint8Array): boolean {
  if (input.length < PNG_SIGNATURE.length) return false;
  const buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  return buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

function startsWithNetpbmMagic(input: Uint8Array): boolean {
  return input.length >= 2
    && input[0] === 0x50
    && (input[1] === 0x33 || input[1] === 0x36);
}

function readPngHeader(data: Buffer): PngHeader {
  if (data.length !== 13) {
    throw new Error('PNG decoder found an invalid IHDR length.');
  }

  return {
    width: data.readUInt32BE(0),
    height: data.readUInt32BE(4),
    bitDepth: data[8]!,
    colorType: data[9]!,
    compression: data[10]!,
    filter: data[11]!,
    interlace: data[12]!,
  };
}

function validateSupportedPngHeader(header: PngHeader): void {
  if (header.width <= 0 || header.height <= 0) {
    throw new Error('PNG decoder expected positive image dimensions.');
  }
  if (header.bitDepth !== 8) {
    throw new Error('PNG decoder currently supports only 8-bit PNG images.');
  }
  if (header.colorType !== 2 && header.colorType !== 6) {
    throw new Error('PNG decoder currently supports RGB and RGBA PNG images.');
  }
  if (header.compression !== 0 || header.filter !== 0) {
    throw new Error('PNG decoder found unsupported compression or filter method.');
  }
  if (header.interlace !== 0) {
    throw new Error('PNG decoder currently supports only non-interlaced PNG images.');
  }
}

function unpackPngScanlines(
  inflated: Buffer,
  width: number,
  height: number,
  bytesPerPixel: number,
): Uint8ClampedArray {
  const rowBytes = width * bytesPerPixel;
  const expectedLength = height * (rowBytes + 1);
  if (inflated.length < expectedLength) {
    throw new Error('PNG decoder found truncated inflated image data.');
  }

  const rgba = new Uint8ClampedArray(width * height * 4);
  let sourceOffset = 0;
  let previous: Uint8Array<ArrayBufferLike> = new Uint8Array(rowBytes);

  for (let y = 0; y < height; y++) {
    const filterType = inflated[sourceOffset++]!;
    const encoded = inflated.subarray(sourceOffset, sourceOffset + rowBytes);
    sourceOffset += rowBytes;
    const row = unfilterPngScanline(filterType, encoded, previous, bytesPerPixel);
    writeRgbRow(rgba, row, y, width, bytesPerPixel, 255);
    previous = row;
  }

  return rgba;
}

function unfilterPngScanline(
  filterType: number,
  encoded: Buffer,
  previous: Uint8Array,
  bytesPerPixel: number,
): Uint8Array {
  const row = new Uint8Array(encoded.length);
  for (let index = 0; index < encoded.length; index++) {
    const raw = encoded[index]!;
    const left = index >= bytesPerPixel ? row[index - bytesPerPixel]! : 0;
    const up = previous[index] ?? 0;
    const upperLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] ?? 0 : 0;

    switch (filterType) {
      case 0:
        row[index] = raw;
        break;
      case 1:
        row[index] = (raw + left) & 0xff;
        break;
      case 2:
        row[index] = (raw + up) & 0xff;
        break;
      case 3:
        row[index] = (raw + Math.floor((left + up) / 2)) & 0xff;
        break;
      case 4:
        row[index] = (raw + paeth(left, up, upperLeft)) & 0xff;
        break;
      default:
        throw new Error(`PNG decoder found unsupported scanline filter ${filterType}.`);
    }
  }
  return row;
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
    rgba[target] = scaleNetpbmSample(readNetpbmBinarySample(buffer[source++]!, 'red', maxValue), maxValue);
    rgba[target + 1] = scaleNetpbmSample(readNetpbmBinarySample(buffer[source++]!, 'green', maxValue), maxValue);
    rgba[target + 2] = scaleNetpbmSample(readNetpbmBinarySample(buffer[source++]!, 'blue', maxValue), maxValue);
    rgba[target + 3] = 255;
  }
  return { width, height, data: rgba };
}

function consumeNetpbmBinarySeparator(buffer: Buffer, cursor: NetpbmCursor): void {
  if (cursor.offset >= buffer.length || !isNetpbmWhitespace(buffer[cursor.offset]!)) {
    throw new Error('PPM decoder expected binary pixel data separator.');
  }

  if (buffer[cursor.offset] === 0x0d && buffer[cursor.offset + 1] === 0x0a) {
    cursor.offset += 2;
    return;
  }

  cursor.offset++;
}

function readPositiveNetpbmInteger(buffer: Buffer, cursor: NetpbmCursor, label: string): number {
  const value = Number(readNetpbmToken(buffer, cursor));
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`PPM decoder expected a positive ${label}.`);
  }
  return value;
}

function readNetpbmSample(
  buffer: Buffer,
  cursor: NetpbmCursor,
  label: string,
  maxValue: number,
): number {
  const value = Number(readNetpbmToken(buffer, cursor));
  if (!Number.isSafeInteger(value) || value < 0 || value > maxValue) {
    throw new Error(`PPM decoder expected ${label} to be between 0 and ${maxValue}.`);
  }
  return value;
}

function readNetpbmBinarySample(value: number, label: string, maxValue: number): number {
  if (value > maxValue) {
    throw new Error(`PPM decoder expected ${label} to be between 0 and ${maxValue}.`);
  }
  return value;
}

function readNetpbmToken(buffer: Buffer, cursor: NetpbmCursor): string {
  skipNetpbmWhitespaceAndComments(buffer, cursor);
  const start = cursor.offset;
  while (cursor.offset < buffer.length && !isNetpbmWhitespace(buffer[cursor.offset]!)) {
    cursor.offset++;
  }
  if (cursor.offset === start) {
    throw new Error('PPM decoder expected another token.');
  }
  return buffer.toString('ascii', start, cursor.offset);
}

function skipNetpbmWhitespaceAndComments(buffer: Buffer, cursor: NetpbmCursor): void {
  while (cursor.offset < buffer.length) {
    const byte = buffer[cursor.offset]!;
    if (isNetpbmWhitespace(byte)) {
      cursor.offset++;
      continue;
    }
    if (byte === 0x23) {
      while (cursor.offset < buffer.length && buffer[cursor.offset] !== 0x0a) {
        cursor.offset++;
      }
      continue;
    }
    break;
  }
}

function isNetpbmWhitespace(byte: number): boolean {
  return byte === 0x20 || byte === 0x0a || byte === 0x0d || byte === 0x09 || byte === 0x0c;
}

function scaleNetpbmSample(value: number, maxValue: number): number {
  return Math.max(0, Math.min(255, Math.round((value / maxValue) * 255)));
}

function writeRgbRow(
  rgba: Uint8ClampedArray,
  row: Uint8Array,
  y: number,
  width: number,
  bytesPerPixel: number,
  fallbackAlpha: number,
): void {
  for (let x = 0; x < width; x++) {
    const source = x * bytesPerPixel;
    const target = ((y * width) + x) * 4;
    rgba[target] = row[source]!;
    rgba[target + 1] = row[source + 1]!;
    rgba[target + 2] = row[source + 2]!;
    rgba[target + 3] = bytesPerPixel === 4 ? row[source + 3]! : fallbackAlpha;
  }
}

function paeth(left: number, up: number, upperLeft: number): number {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  if (upDistance <= upperLeftDistance) return up;
  return upperLeft;
}
