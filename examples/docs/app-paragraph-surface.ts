import {
  wrapToWidth,
  type Surface,
} from '../../packages/bijou/src/index.js';
import { textSurface } from '../_shared/example-surfaces.js';

export function paragraphSurface(text: string, width: number): Surface {
  const safeWidth = Math.max(1, width);
  const wrapped = wrapToWidth(text, safeWidth);
  return textSurface(
    wrapped.join('\n'),
    safeWidth,
    Math.max(1, wrapped.length),
  );
}
