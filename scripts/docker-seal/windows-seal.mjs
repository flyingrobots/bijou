import { MARKER } from './constants.mjs';

/**
 * Accept only the exact seal text that bootstrap puts into the toolchain
 * image. A refusal reports the start of the text it read, because a checkout
 * that converts line endings changes the marker's bytes.
 */
export function requireSealMarker(text, purpose) {
  if (text !== MARKER) throw new Error(`${purpose} requires the sealed image: marker is ${JSON.stringify(text.slice(0, 64))}`);
}
