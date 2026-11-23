import type { UiActionRequest } from '@flyingrobots/bijou-tui';
import type { BijouDomElement, BijouDomEvent } from './dom-contract.js';
import type { DomMounted, DomPatcher, DomSession } from './dom-patch.js';

/** What the event bridge needs from the mount. */
export interface DomEventBridgeOptions {
  readonly patcher: DomPatcher;
  readonly session: DomSession;
  readonly invoke: (request: UiActionRequest) => void;
}

/** The event types that the bridge delegates from the mount root. */
export const DOM_EVENT_TYPES = ['click', 'keydown', 'input', 'compositionstart', 'compositionend'] as const;

type DomEventType = (typeof DOM_EVENT_TYPES)[number];

/**
 * Delegate DOM events from `root` to action requests, and return the function
 * that removes every listener the bridge added.
 *
 * - `click` sends the first action of the nearest element with an action. A
 *   native `<button>` turns Enter and Space into one `click`, so the bridge
 *   never handles a key on it and the action runs once.
 * - `keydown` Enter or Space on a plain element with an action sends that
 *   action and prevents the default.
 * - `input` on an `<input>` sends its value, except while a composition is in
 *   progress. `compositionend` sends the committed value once. A later
 *   `input` event on the same element is skipped when it repeats that value
 *   and the scene has not changed the value since.
 */
export function bridgeDomEvents(root: BijouDomElement, options: DomEventBridgeOptions): () => void {
  const { patcher, session, invoke } = options;
  const committed = new Map<string, { readonly element: unknown; readonly value: string; readonly sceneValue: string | undefined }>();

  const actionable = (entry: DomMounted | undefined): DomMounted | undefined => {
    let at = entry;
    while (at?.spec.actionIds.length === 0) {
      at = at.parentId === undefined ? undefined : patcher.mounted(at.parentId);
    }
    return at;
  };
  const send = (entry: DomMounted, value?: string): void => {
    const actionId = entry.spec.actionIds[0];
    if (actionId !== undefined) invoke(value === undefined ? { actionId } : { actionId, value });
  };
  const inputAt = (event: BijouDomEvent): DomMounted | undefined => {
    const entry = patcher.nearest(event.target);
    return entry?.spec.kind === 'input' ? entry : undefined;
  };

  const handlers: Readonly<Record<DomEventType, (event: BijouDomEvent) => void>> = {
    click(event) {
      const entry = patcher.nearest(event.target);
      if (entry === undefined || entry.spec.kind === 'input') return;
      const target = actionable(entry);
      if (target !== undefined) send(target);
    },
    keydown(event) {
      const entry = patcher.nearest(event.target);
      if (entry?.spec.kind !== 'plain' || entry.spec.actionIds.length === 0) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      send(entry);
    },
    input(event) {
      const entry = inputAt(event);
      if (entry === undefined || event.isComposing === true) return;
      const { nodeId } = entry.spec;
      if (session.composing.has(nodeId)) return;
      const value = entry.element.value ?? '';
      const mark = committed.get(nodeId);
      const repeat = mark?.element === entry.element && mark.value === value && mark.sceneValue === entry.sceneValue;
      committed.delete(nodeId);
      if (!repeat) send(entry, value);
    },
    compositionstart(event) {
      const entry = inputAt(event);
      if (entry !== undefined) session.composing.add(entry.spec.nodeId);
    },
    compositionend(event) {
      const entry = inputAt(event);
      if (entry === undefined) return;
      const value = entry.element.value ?? '';
      session.composing.delete(entry.spec.nodeId);
      send(entry, value);
      committed.set(entry.spec.nodeId, { element: entry.element, value, sceneValue: entry.sceneValue });
    },
  };

  for (const type of DOM_EVENT_TYPES) root.addEventListener(type, handlers[type]);
  return () => {
    for (const type of DOM_EVENT_TYPES) root.removeEventListener(type, handlers[type]);
    committed.clear();
  };
}
