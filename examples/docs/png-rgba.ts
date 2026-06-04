import { inflateSync } from 'node:zlib';
import type { RgbaFrame } from '../../packages/bijou-tui/src/index.js';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

interface PngHeader {
  readonly width: number;
  readonly height: number;
  readonly bitDepth: number;
  readonly colorType: number;
  readonly compression: number;
  readonly filter: number;
  readonly interlace: number;
}

export function decodePngRgba(input: Uint8Array): RgbaFrame {
  const buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  if (buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
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
      header = readHeader(data);
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

  validateSupportedHeader(header);
  const bytesPerPixel = header.colorType === 6 ? 4 : 3;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const rgba = unpackScanlines(inflated, header.width, header.height, bytesPerPixel);
  return {
    width: header.width,
    height: header.height,
    data: rgba,
  };
}

function readHeader(data: Buffer): PngHeader {
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

function validateSupportedHeader(header: PngHeader): void {
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

function unpackScanlines(
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
    const row = unfilterScanline(filterType, encoded, previous, bytesPerPixel);
    writeRgbaRow(rgba, row, y, width, bytesPerPixel);
    previous = row;
  }

  return rgba;
}

function unfilterScanline(
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

function writeRgbaRow(
  rgba: Uint8ClampedArray,
  row: Uint8Array,
  y: number,
  width: number,
  bytesPerPixel: number,
): void {
  for (let x = 0; x < width; x++) {
    const source = x * bytesPerPixel;
    const target = ((y * width) + x) * 4;
    rgba[target] = row[source]!;
    rgba[target + 1] = row[source + 1]!;
    rgba[target + 2] = row[source + 2]!;
    rgba[target + 3] = bytesPerPixel === 4 ? row[source + 3]! : 255;
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
