import type { BijouCanvasNode } from './canvas-contract.js';
import { createFakeTarget, type FakeTarget } from './interactive.test-support.js';
import type { WebPointerEvent, WebRect, WebTextEvent } from './web-dom.js';

/** The context types a canvas can bind. A canvas binds one for its lifetime. */
export type FakeContextKind = 'webgpu' | 'webgl2' | '2d';

/** An in-memory `<canvas>` that, like a real one, binds a single context type. */
export interface FakeCanvas extends FakeTarget<WebPointerEvent> {
  readonly id: number;
  parentNode: BijouCanvasNode | null;
  width: number;
  height: number;
  getBoundingClientRect(): WebRect;
  /** A context object, or `null` once the canvas is bound to another type. */
  getContext(kind: FakeContextKind): object | null;
  bound(): FakeContextKind | undefined;
}

/** An in-memory hidden `<textarea>` whose focus the fake document tracks. */
export interface FakeTextarea extends FakeTarget<WebTextEvent> {
  parentNode: BijouCanvasNode | null;
  value: string;
  focus(): void;
}

/** An in-memory document: creates textareas and tracks the focused element. */
export interface FakeDocument {
  activeElement: unknown;
  createElement(tag: string): BijouCanvasNode;
  readonly textareas: FakeTextarea[];
}

/** An in-memory container that records its children. */
export interface FakeContainer {
  readonly parentNode: BijouCanvasNode | null;
  readonly ownerDocument: FakeDocument;
  readonly children: BijouCanvasNode[];
  appendChild(node: BijouCanvasNode): unknown;
  removeChild(node: BijouCanvasNode): unknown;
  canvases(): FakeCanvas[];
}

/** Every canvas a test created, in creation order. */
export interface CanvasMaker {
  readonly made: FakeCanvas[];
  create(): FakeCanvas;
}

/** A canvas factory whose canvases are 800 by 480 CSS pixels at (0, 0). */
export function createCanvasMaker(): CanvasMaker {
  const made: FakeCanvas[] = [];
  return {
    made,
    create() {
      let bound: FakeContextKind | undefined;
      const canvas: FakeCanvas = Object.assign(createFakeTarget<WebPointerEvent>(), {
        id: made.length + 1,
        parentNode: null,
        width: 300,
        height: 150,
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 480 }),
        getContext(kind: FakeContextKind) {
          if (bound !== undefined && bound !== kind) return null;
          bound = kind;
          return { kind };
        },
        bound: () => bound,
      });
      made.push(canvas);
      return canvas;
    },
  };
}

function createDocument(): FakeDocument {
  const doc: FakeDocument = {
    activeElement: null,
    textareas: [],
    createElement(tag) {
      if (tag !== 'textarea') return { parentNode: null };
      const textarea: FakeTextarea = Object.assign(createFakeTarget<WebTextEvent>(), {
        parentNode: null,
        value: '',
        focus() { doc.activeElement = textarea; },
      });
      doc.textareas.push(textarea);
      return textarea;
    },
  };
  return doc;
}

function isFakeCanvas(node: BijouCanvasNode): node is FakeCanvas {
  return 'getContext' in node;
}

/** Create an empty container with its own fake document. */
export function createFakeContainer(): FakeContainer {
  const children: BijouCanvasNode[] = [];
  const container: FakeContainer = {
    parentNode: null,
    ownerDocument: createDocument(),
    children,
    appendChild(node) {
      children.push(node);
      Reflect.set(node, 'parentNode', container);
      return node;
    },
    removeChild(node) {
      const index = children.indexOf(node);
      if (index < 0) throw new Error('removeChild: not a child');
      children.splice(index, 1);
      Reflect.set(node, 'parentNode', null);
      return node;
    },
    canvases: () => children.filter(isFakeCanvas),
  };
  return container;
}
