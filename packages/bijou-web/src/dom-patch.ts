import type { UiSceneBrowserAttribute, UiSceneBrowserElement } from '@flyingrobots/bijou';
import type { BijouDomDocument, BijouDomElement, BijouDomNode, BijouDomText } from './dom-contract.js';
import { hostSpec, type DomHostSpec } from './dom-elements.js';
import { restoreFocus } from './dom-focus.js';

/** One element that the patcher owns, keyed by its node id. */
export interface DomMounted {
  spec: DomHostSpec;
  readonly element: BijouDomElement;
  attributes: ReadonlyMap<string, string>;
  text: BijouDomText | undefined;
  /** The value the scene last gave an `<input>`. */
  sceneValue: string | undefined;
  parentId: string | undefined;
}

/** State that the patcher and the event bridge share. */
export interface DomSession {
  /** Node ids of inputs with a composition in progress. */
  readonly composing: Set<string>;
}

export interface DomPatcher {
  /** Patch the root to match a lowered tree's wrapper element. */
  patch(tree: UiSceneBrowserElement): void;
  /** The owned element at or nearest above an event target. */
  nearest(target: unknown): DomMounted | undefined;
  mounted(nodeId: string): DomMounted | undefined;
}

function isNode(value: unknown): value is BijouDomNode {
  return typeof value === 'object' && value !== null && 'parentNode' in value;
}

function diffAttributes(
  element: BijouDomElement,
  previous: ReadonlyMap<string, string>,
  next: readonly UiSceneBrowserAttribute[],
): ReadonlyMap<string, string> {
  const wanted = new Map(next.map((item) => [item.name, item.value]));
  for (const [name, value] of wanted) if (previous.get(name) !== value) element.setAttribute(name, value);
  for (const name of previous.keys()) if (!wanted.has(name)) element.removeAttribute(name);
  return wanted;
}

/** Make `parent` hold exactly `desired`, in order, moving only what is out of place. */
function reconcileChildren(parent: BijouDomElement, desired: readonly BijouDomNode[]): void {
  desired.forEach((node, index) => {
    const current = parent.childNodes[index];
    if (current !== node) parent.insertBefore(node, current ?? null);
  });
  for (let extra = parent.childNodes[desired.length]; extra !== undefined; extra = parent.childNodes[desired.length]) {
    parent.removeChild(extra);
  }
}

/**
 * Create a keyed patcher for `root`. Each lowered node keeps its element for
 * as long as its `data-bijou-node-id` stays in the scene and its host tag does
 * not change; attributes, text, and input values are diffed in place.
 */
export function createDomPatcher(
  document: BijouDomDocument,
  root: BijouDomElement,
  session: DomSession,
  focusableNodeIds: readonly string[],
): DomPatcher {
  const byId = new Map<string, DomMounted>();
  const byElement = new Map<unknown, DomMounted>();
  let rootAttributes: ReadonlyMap<string, string> = new Map();

  const writeText = (entry: DomMounted, text: string): void => {
    if (text === '') entry.text = undefined;
    else if (entry.text === undefined) entry.text = document.createTextNode(text);
    else if (entry.text.data !== text) entry.text.data = text;
  };
  const writeValue = (entry: DomMounted, value: string): void => {
    if (entry.sceneValue === value) return;
    entry.sceneValue = value;
    if (session.composing.has(entry.spec.nodeId) || entry.element.value === value) return;
    entry.element.value = value;
  };
  const claim = (spec: DomHostSpec, parentId: string | undefined): DomMounted => {
    const existing = byId.get(spec.nodeId);
    if (existing?.spec.tag === spec.tag) return Object.assign(existing, { spec, parentId });
    if (existing !== undefined) byElement.delete(existing.element);
    const element = document.createElement(spec.tag);
    const entry: DomMounted = { spec, element, attributes: new Map(), text: undefined, sceneValue: undefined, parentId };
    byId.set(spec.nodeId, entry);
    byElement.set(element, entry);
    return entry;
  };
  const patchNode = (lowered: UiSceneBrowserElement, parentId: string | undefined, seen: Set<string>): BijouDomElement => {
    const entry = claim(hostSpec(lowered), parentId);
    entry.attributes = diffAttributes(entry.element, entry.attributes, entry.spec.attributes);
    if (entry.spec.kind === 'input') writeValue(entry, lowered.text ?? '');
    else writeText(entry, lowered.text ?? '');
    const children = lowered.children.map((child) => patchNode(child, entry.spec.nodeId, seen));
    reconcileChildren(entry.element, entry.text === undefined ? children : [entry.text, ...children]);
    seen.add(entry.spec.nodeId);
    return entry.element;
  };

  return {
    patch(tree) {
      const active = document.activeElement;
      const focused = byElement.get(active);
      const seen = new Set<string>();
      rootAttributes = diffAttributes(root, rootAttributes, tree.attributes);
      reconcileChildren(root, tree.children.map((child) => patchNode(child, undefined, seen)));
      restoreFocus({ focused, active, seen, byId, root, focusableNodeIds });
      for (const [nodeId, entry] of byId) {
        if (seen.has(nodeId)) continue;
        byId.delete(nodeId);
        byElement.delete(entry.element);
        session.composing.delete(nodeId);
      }
    },
    nearest(target) {
      for (let at: unknown = target; isNode(at) && at !== root; at = at.parentNode) {
        const entry = byElement.get(at);
        if (entry !== undefined) return entry;
      }
      return undefined;
    },
    mounted: (nodeId) => byId.get(nodeId),
  };
}
