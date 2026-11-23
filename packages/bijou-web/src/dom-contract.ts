import type { BijouContext } from '@flyingrobots/bijou';
import type {
  SemanticSceneController,
  SemanticSceneCrash,
  SemanticSceneDiagnostic,
} from '@flyingrobots/bijou-tui';

/**
 * The parts of a browser DOM that {@link mountBijouDom} uses. They are
 * structural, so a page passes its real `document` and an element, and a test
 * passes an in-memory document. Nothing here names a DOM library type.
 */
export interface BijouDomNode {
  readonly parentNode: BijouDomNode | null;
}

/** A text node. The patcher changes `data` in place. */
export interface BijouDomText extends BijouDomNode {
  data: string;
}

/** The inline style of an element. The theme sync writes custom properties. */
export interface BijouDomStyle {
  setProperty(name: string, value: string): void;
  removeProperty(name: string): unknown;
}

/** The fields of a DOM event that the event bridge reads. */
export interface BijouDomEvent {
  readonly type: string;
  readonly target: unknown;
  readonly key?: string | undefined;
  readonly isComposing?: boolean | undefined;
  preventDefault(): void;
}

/** A DOM element. `value` exists on an `<input>`. */
export interface BijouDomElement extends BijouDomNode {
  readonly childNodes: ArrayLike<BijouDomNode>;
  readonly style: BijouDomStyle;
  value?: string;
  readonly ownerDocument?: BijouDomDocument | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  insertBefore(node: BijouDomNode, child: BijouDomNode | null): unknown;
  removeChild(node: BijouDomNode): unknown;
  addEventListener(type: string, listener: (event: BijouDomEvent) => void): void;
  removeEventListener(type: string, listener: (event: BijouDomEvent) => void): void;
  focus(): void;
}

/** The document that creates elements and reports the focused element. */
export interface BijouDomDocument {
  createElement(tag: string): BijouDomElement;
  createTextNode(data: string): BijouDomText;
  readonly activeElement: unknown;
}

/** The text direction that the mount root carries in `dir`. */
export type BijouDomDirection = 'ltr' | 'rtl' | 'auto';

/** Options for {@link mountBijouDom}. */
export interface MountBijouDomOptions<Model> {
  /** The document that owns `container`. Defaults to `container.ownerDocument`. */
  readonly document?: BijouDomDocument | undefined;
  /** The context of the app. Defaults to `createWebContext()`. */
  readonly ctx?: BijouContext | undefined;
  /**
   * Node ids that may take focus, in order. When the focused node leaves the
   * scene, focus moves to the first of these that the new scene still has.
   */
  readonly focusableNodeIds?: readonly string[] | undefined;
  /** The direction for a model. Without it the root has no `dir` attribute. */
  readonly direction?: ((model: Model) => BijouDomDirection) | undefined;
  readonly onDiagnostic?: ((diagnostic: SemanticSceneDiagnostic) => void) | undefined;
  readonly onCrash?: ((crash: SemanticSceneCrash<Model>) => void) | undefined;
}

/** A mounted app. */
export interface BijouDomHandle<Model, M> {
  /** The element that holds the lowered scene, inside the container. */
  readonly root: BijouDomElement;
  /** The controller that runs the app. */
  readonly controller: SemanticSceneController<Model, M>;
  /** Stop the app, remove every listener, and detach `root`. Safe to repeat. */
  stop(): void;
}
