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
    rgba[target] = row[source] ?? 0;
    rgba[target + 1] = row[source + 1] ?? 0;
    rgba[target + 2] = row[source + 2] ?? 0;
    rgba[target + 3] = bytesPerPixel === 4 ? row[source + 3] ?? fallbackAlpha : fallbackAlpha;
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

function unfilterPngScanline(
  filterType: number,
  encoded: Buffer,
  previous: Uint8Array,
  bytesPerPixel: number,
): Uint8Array {
  const row = new Uint8Array(encoded.length);
  for (let index = 0; index < encoded.length; index++) {
    const raw = encoded[index] ?? 0;
    const left = index >= bytesPerPixel ? row[index - bytesPerPixel] ?? 0 : 0;
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
        throw new Error(`PNG decoder found unsupported scanline filter ${String(filterType)}.`);
    }
  }
  return row;
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
  let previous: Uint8Array = new Uint8Array(rowBytes);

  for (let y = 0; y < height; y++) {
    const filterType = inflated[sourceOffset++] ?? 0;
    const encoded = inflated.subarray(sourceOffset, sourceOffset + rowBytes);
    sourceOffset += rowBytes;
    const row = unfilterPngScanline(filterType, encoded, previous, bytesPerPixel);
    writeRgbRow(rgba, row, y, width, bytesPerPixel, 255);
    previous = row;
  }

  return rgba;
}

function isPng(input: Uint8Array): boolean {
  if (input.length < PNG_SIGNATURE.length) return false;
  const buffer = Buffer.from(input);
  return buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

export type { NetpbmCursor, PngHeader };
export { PNG_SIGNATURE, isPng, unpackPngScanlines };
