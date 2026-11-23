import type { BijouDomEvent } from './dom-contract.js';

type Listener = (event: BijouDomEvent) => void;

/** Counts of host writes, for asserting bounded in-place patches. */
export interface DomCounts { created: number; writes: number }

/** An in-memory text node. Writing `data` counts as a host write. */
export class FakeText {
  parentNode: FakeElement | null = null;
  #data: string;
  constructor(readonly doc: FakeDocument, data: string) { this.#data = data; }
  get data(): string { return this.#data; }
  set data(value: string) { this.doc.counts.writes += 1; this.#data = value; }
}

/**
 * An in-memory element. It models the browser rules the patcher relies on:
 * a moved node leaves its old parent, removing the focused node drops focus to
 * `body`, and setting an `<input>` value that differs moves the caret to the end.
 */
export class FakeElement {
  parentNode: FakeElement | null = null;
  readonly childNodes: (FakeElement | FakeText)[] = [];
  readonly attributes = new Map<string, string>();
  readonly listeners = new Map<string, Set<Listener>>();
  readonly properties = new Map<string, string>();
  readonly style = {
    setProperty: (name: string, value: string): void => { this.doc.counts.writes += 1; this.properties.set(name, value); },
    removeProperty: (name: string): void => { this.doc.counts.writes += 1; this.properties.delete(name); },
  };
  selectionStart = 0;
  selectionEnd = 0;
  #value = '';
  constructor(readonly doc: FakeDocument, readonly tagName: string) {}
  get ownerDocument(): FakeDocument { return this.doc; }
  get value(): string { return this.#value; }
  set value(next: string) { this.doc.counts.writes += 1; this.userValue(next, next.length, next.length, true); }
  /** Change the value as typing does, without counting a host write. */
  userValue(next: string, start = next.length, end = start, host = false): void {
    if (host && next === this.#value) return;
    this.#value = next;
    this.selectionStart = start;
    this.selectionEnd = end;
  }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  setAttribute(name: string, value: string): void { this.doc.counts.writes += 1; this.attributes.set(name, value); }
  removeAttribute(name: string): void { this.doc.counts.writes += 1; this.attributes.delete(name); }
  insertBefore(node: FakeElement | FakeText, child: FakeElement | FakeText | null): void {
    this.doc.counts.writes += 1;
    node.parentNode?.detach(node);
    const index = child === null ? -1 : this.childNodes.indexOf(child);
    if (index < 0) this.childNodes.push(node);
    else this.childNodes.splice(index, 0, node);
    node.parentNode = this;
  }
  appendChild(node: FakeElement | FakeText): void { this.insertBefore(node, null); }
  removeChild(node: FakeElement | FakeText): void { this.doc.counts.writes += 1; this.detach(node); }
  detach(node: FakeElement | FakeText): void {
    const index = this.childNodes.indexOf(node);
    if (index < 0) throw new Error('not a child');
    this.childNodes.splice(index, 1);
    node.parentNode = null;
    const active = this.doc.activeElement;
    if (node instanceof FakeElement && active !== null && node.contains(active)) this.doc.activeElement = this.doc.body;
  }
  contains(other: FakeElement): boolean {
    for (let at: FakeElement | null = other; at !== null; at = at.parentNode) if (at === this) return true;
    return false;
  }
  addEventListener(type: string, listener: Listener): void {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: Listener): void { this.listeners.get(type)?.delete(listener); }
  focus(): void { if (this.doc.body.contains(this)) this.doc.activeElement = this; }
  get textContent(): string {
    return this.childNodes.map((child) => child instanceof FakeText ? child.data : child.textContent).join('');
  }
  /** The descendant whose `data-bijou-node-id` is `nodeId`. */
  node(nodeId: string): FakeElement {
    const found = this.find((element) => element.getAttribute('data-bijou-node-id') === nodeId);
    if (found === undefined) throw new Error(`no element for ${nodeId}`);
    return found;
  }
  find(test: (element: FakeElement) => boolean): FakeElement | undefined {
    for (const child of this.childNodes) {
      if (!(child instanceof FakeElement)) continue;
      if (test(child)) return child;
      const found = child.find(test);
      if (found !== undefined) return found;
    }
    return undefined;
  }
}

/** An event as the fake dispatches it; `defaultPrevented` records the call. */
export interface FakeEvent extends BijouDomEvent { defaultPrevented: boolean }

/** An in-memory document with a connected `body`. */
export class FakeDocument {
  readonly counts: DomCounts = { created: 0, writes: 0 };
  readonly elements: FakeElement[] = [];
  readonly body: FakeElement;
  activeElement: FakeElement | null;
  constructor() { this.body = new FakeElement(this, 'body'); this.activeElement = this.body; }
  createElement(tag: string): FakeElement {
    this.counts.created += 1;
    const element = new FakeElement(this, tag.toLowerCase());
    this.elements.push(element);
    return element;
  }
  createTextNode(data: string): FakeText { this.counts.created += 1; return new FakeText(this, data); }
  /** Listeners still attached to any element this document created. */
  liveListeners(): number {
    return [this.body, ...this.elements].reduce((sum, element) =>
      sum + [...element.listeners.values()].reduce((count, set) => count + set.size, 0), 0);
  }
  /** Deliver an event from `target` up through its ancestors. */
  dispatch(target: FakeElement, type: string, fields: Partial<BijouDomEvent> = {}): FakeEvent {
    const event: FakeEvent = { type, target, ...fields, defaultPrevented: false, preventDefault() { event.defaultPrevented = true; } };
    for (let at: FakeElement | null = target; at !== null; at = at.parentNode) {
      for (const listener of [...(at.listeners.get(type) ?? [])]) listener(event);
    }
    return event;
  }
  /**
   * Press a key on `target`. As in a browser, Enter or Space on a `<button>`
   * whose keydown is not prevented also fires one `click`.
   */
  press(target: FakeElement, key: string): void {
    const keydown = this.dispatch(target, 'keydown', { key });
    const activates = key === 'Enter' || key === ' ';
    if (!keydown.defaultPrevented && activates && target.tagName === 'button') this.dispatch(target, 'click');
  }
  /** Type `value` into an input as a user does, with the caret at `caret`. */
  type(input: FakeElement, value: string, caret = value.length): void {
    input.userValue(value, caret);
    this.dispatch(input, 'input', { isComposing: false });
  }
  /**
   * Compose `committed` through `steps`. `endFirst` puts `compositionend`
   * before the last `input` event, as some engines do.
   */
  compose(input: FakeElement, steps: readonly string[], committed: string, endFirst = false): void {
    this.dispatch(input, 'compositionstart');
    for (const step of steps) { input.userValue(step); this.dispatch(input, 'input', { isComposing: true }); }
    input.userValue(committed);
    if (endFirst) {
      this.dispatch(input, 'compositionend');
      this.dispatch(input, 'input', { isComposing: false });
      return;
    }
    this.dispatch(input, 'input', { isComposing: true });
    this.dispatch(input, 'compositionend');
  }
}
