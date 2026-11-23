import type { BijouCanvasContainer, BijouCanvasNode, BijouCanvasTextarea } from './canvas-contract.js';
import { BijouCanvasError } from './canvas-errors.js';

/** Visually hidden but focusable, so IME and the on-screen keyboard still work. */
const TEXTAREA_CSS = 'position:absolute;left:0;top:0;width:1px;height:1px;padding:0;border:0;'
  + 'opacity:0;resize:none;overflow:hidden;white-space:pre;';

/** The canvas fills the container, whose content box the resize observer measures. */
const CANVAS_CSS = 'display:block;width:100%;height:100%;';

function isTextarea(node: BijouCanvasNode): node is BijouCanvasTextarea {
  return 'value' in node && typeof Reflect.get(node, 'focus') === 'function'
    && typeof Reflect.get(node, 'addEventListener') === 'function';
}

/** Set inline CSS when the node has an inline style, as a real element does. */
export function styleNode(node: BijouCanvasNode, css: 'canvas' | 'textarea'): void {
  const style: unknown = Reflect.get(node, 'style');
  if (typeof style === 'object' && style !== null) Reflect.set(style, 'cssText', css === 'canvas' ? CANVAS_CSS : TEXTAREA_CSS);
}

/** A textarea from `create`, else from the container's document. */
export function createTextarea(container: BijouCanvasContainer, create?: () => BijouCanvasTextarea): BijouCanvasTextarea {
  if (create !== undefined) return create();
  const node = container.ownerDocument?.createElement('textarea');
  if (node === undefined || !isTextarea(node)) {
    throw new BijouCanvasError('BIJOU_WEB_CANVAS_NO_TEXTAREA', 'the container has no ownerDocument to create a textarea; pass options.createTextarea');
  }
  styleNode(node, 'textarea');
  return node;
}

/** Remove `node` when it is still a child of `container`. */
export function detachNode(container: BijouCanvasContainer, node: BijouCanvasNode): void {
  if (node.parentNode === container) container.removeChild(node);
}

/** Whether the document's focused element is `node`. */
export function hasFocus(container: BijouCanvasContainer, node: BijouCanvasNode): boolean {
  return container.ownerDocument?.activeElement === node;
}
