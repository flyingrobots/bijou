import type { BijouDomElement } from './dom-contract.js';
import type { DomMounted } from './dom-patch.js';

/** What the patcher knows about focus after one patch. */
export interface FocusRestore {
  /** The owned element that had focus before the patch, if any. */
  readonly focused: DomMounted | undefined;
  /** The document's active element after the patch. */
  readonly active: unknown;
  /** Node ids that the new scene has. */
  readonly seen: ReadonlySet<string>;
  /** Every owned element, including the ones that just left the scene. */
  readonly byId: ReadonlyMap<string, DomMounted>;
  readonly root: BijouDomElement;
  readonly focusableNodeIds: readonly string[];
}

/** Focus an element, giving a plain element `tabindex="-1"` when it has none. */
function focusEntry(entry: DomMounted): void {
  if (entry.spec.kind === 'plain' && !entry.attributes.has('tabindex')) {
    entry.element.setAttribute('tabindex', '-1');
  }
  entry.element.focus();
}

/**
 * Keep focus inside the mount when the focused node leaves the scene.
 *
 * The fallback, in order: the first of `focusableNodeIds` that the new scene
 * has; then the nearest ancestor of the removed node that the new scene has;
 * then the mount root. When the focused node stays but its element was
 * replaced, or moving it lost focus, its element gets focus again. Nothing
 * happens when focus was not on an owned element.
 */
export function restoreFocus(state: FocusRestore): void {
  const { focused, seen, byId } = state;
  if (focused === undefined) return;
  const current = byId.get(focused.spec.nodeId);
  if (seen.has(focused.spec.nodeId) && current !== undefined) {
    if (current.element !== state.active) focusEntry(current);
    return;
  }
  for (const nodeId of state.focusableNodeIds) {
    const entry = byId.get(nodeId);
    if (seen.has(nodeId) && entry !== undefined) {
      focusEntry(entry);
      return;
    }
  }
  for (let parentId = focused.parentId; parentId !== undefined; parentId = byId.get(parentId)?.parentId) {
    const entry = byId.get(parentId);
    if (seen.has(parentId) && entry !== undefined) {
      focusEntry(entry);
      return;
    }
  }
  state.root.setAttribute('tabindex', '-1');
  state.root.focus();
}
