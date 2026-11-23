import { createWebClock } from './clock.js';
import { createFakeClockHost, type FakeClockHost } from './clock.test-support.js';
import { createWebContext, type WebContext } from './context.js';
import type { BijouDomHandle, MountBijouDomOptions } from './dom-contract.js';
import { createControlsApp, type ControlsModel, type ControlsMsg, type ControlsOptions } from './dom-app.test-support.js';
import { FakeDocument, type FakeElement } from './dom-document.test-support.js';
import { mountBijouDom } from './dom-mount.js';

/** One mounted controls app on an in-memory document. */
export interface MountedControls {
  readonly doc: FakeDocument;
  readonly container: FakeElement;
  readonly host: FakeClockHost;
  readonly ctx: WebContext;
  readonly handle: BijouDomHandle<ControlsModel, ControlsMsg>;
  /** The element of a scene node. */
  readonly node: (nodeId: string) => FakeElement;
  /** The mount root, as the fake element it is. */
  readonly root: () => FakeElement;
}

/** Mount the controls app in a container attached to the document body. */
export function mountControls(
  options: Omit<MountBijouDomOptions<ControlsModel>, 'ctx' | 'document'> = {},
  app: Omit<ControlsOptions, 'clock'> & { readonly timers?: boolean } = {},
): MountedControls {
  const doc = new FakeDocument();
  const container = doc.createElement('main');
  doc.body.appendChild(container);
  const host = createFakeClockHost();
  const clock = createWebClock({ host });
  const ctx = createWebContext({ clock, mode: 'interactive' });
  const controls = createControlsApp({ ...app, ...(app.timers === true ? { clock } : {}) });
  const handle = mountBijouDom(controls, container, { ...options, ctx });
  const root = (): FakeElement => {
    const found = doc.elements.find((element) => element === handle.root);
    if (found === undefined) throw new Error('the root is not a fake element');
    return found;
  };
  return { doc, container, host, ctx, handle, node: (nodeId) => container.node(nodeId), root };
}
