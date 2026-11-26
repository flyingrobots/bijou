import { sha256Text } from '../sha256-text.js';
import { canonicalJson } from './canonical-json.js';
import type { ReplayFrameContent } from './replay-event.js';

/**
 * The DL-033 `frame.hash`: `"sha256:<hex>"` of the UTF-8 bytes of the
 * canonical JSON of `{ width, height, styles, cells }`. Other fields of the
 * argument (such as `index` or an old `hash`) are not hashed.
 *
 * Pure: it runs in Node and in a browser.
 */
export function surfaceFrameHash(frame: ReplayFrameContent): string {
  const { width, height, styles, cells } = frame;
  return sha256Text(canonicalJson({ width, height, styles, cells }));
}
