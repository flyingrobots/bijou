import { inflateSync } from 'node:zlib';
import type { RgbaFrame } from '../../packages/bijou-tui/src/index.js';
import { PNG_SIGNATURE, isPng, unpackPngScanlines } from './image-codecs.part01.js';
import type { NetpbmCursor, PngHeader } from './image-codecs.part01.js';

function readPngHeader(data: Buffer): PngHeader {
  if (data.length !== 13) {
    throw new Error('PNG decoder found an invalid IHDR length.');
  }

  return {
    width: data.readUInt32BE(0),
    height: data.readUInt32BE(4),
    bitDepth: data[8] ?? 0,
    colorType: data[9] ?? 0,
    compression: data[10] ?? 0,
    filter: data[11] ?? 0,
    interlace: data[12] ?? 0,
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

export function decodePngRgba(input: Uint8Array): RgbaFrame {
  const buffer = Buffer.from(input);
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

function startsWithNetpbmMagic(input: Uint8Array): boolean {
  return input.length >= 2
    && input[0] === 0x50
    && (input[1] === 0x33 || input[1] === 0x36);
}

function isNetpbmWhitespace(byte: number): boolean {
  return byte === 0x20 || byte === 0x0a || byte === 0x0d || byte === 0x09 || byte === 0x0c;
}

function skipNetpbmWhitespaceAndComments(buffer: Buffer, cursor: NetpbmCursor): void {
  while (cursor.offset < buffer.length) {
    const byte = buffer[cursor.offset] ?? 0;
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

function readNetpbmToken(buffer: Buffer, cursor: NetpbmCursor): string {
  skipNetpbmWhitespaceAndComments(buffer, cursor);
  const start = cursor.offset;
  while (cursor.offset < buffer.length && !isNetpbmWhitespace(buffer[cursor.offset] ?? 0)) {
    cursor.offset++;
  }
  if (cursor.offset === start) {
    throw new Error('PPM decoder expected another token.');
  }
  return buffer.toString('ascii', start, cursor.offset);
}

export { isNetpbmWhitespace, readNetpbmToken, startsWithNetpbmMagic };
