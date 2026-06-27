import type { TokenValue } from './tokens.js';
import type { ColorTransform } from './graph-types.js';
import { complementary, darken, desaturate, hexToRgb, lighten, mix, rgbToHex, saturate } from './color.js';

export type ResolveTransformReference = (path: string) => string;

export function applyGraphColorTransform(
  color: string,
  transform: ColorTransform,
  resolveReference: ResolveTransformReference,
): string {
  const token: TokenValue = { hex: color };
  let result: TokenValue;

  switch (transform.type) {
    case 'darken': result = darken(token, transform.amount); break;
    case 'lighten': result = lighten(token, transform.amount); break;
    case 'saturate': result = saturate(token, transform.amount); break;
    case 'desaturate': result = desaturate(token, transform.amount); break;
    case 'complementary': result = complementary(token); break;
    case 'inverse': result = invert(token); break;
    case 'mix': {
      result = mix(token, { hex: resolveReference(transform.with) }, transform.ratio ?? 0.5);
      break;
    }
    default: {
      const exhaustive: never = transform;
      throw new Error(`Unknown transform type: ${String(exhaustive)}`);
    }
  }

  return result.hex;
}

function invert(token: TokenValue): TokenValue {
  const rgb = hexToRgb(token.hex);
  return {
    hex: rgbToHex([255 - rgb[0], 255 - rgb[1], 255 - rgb[2]]),
  };
}
