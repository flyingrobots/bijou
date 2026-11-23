import { lowerUiSceneToBrowser, observeTheme } from '@flyingrobots/bijou';
import {
  createSemanticSceneController,
  type SemanticSceneApp,
  type SemanticSceneFrame,
} from '@flyingrobots/bijou-tui';
import { createWebContext } from './context.js';
import type {
  BijouDomDirection,
  BijouDomDocument,
  BijouDomElement,
  BijouDomHandle,
  MountBijouDomOptions,
} from './dom-contract.js';
import { bridgeDomEvents } from './dom-events.js';
import { createDomPatcher, type DomSession } from './dom-patch.js';
import { createThemeSync } from './dom-theme.js';

function ownerDocument(container: BijouDomElement, document: BijouDomDocument | undefined): BijouDomDocument {
  const owner = document ?? container.ownerDocument;
  if (owner == null) throw new Error('mountBijouDom() needs options.document or a container with an ownerDocument.');
  return owner;
}

/**
 * Mount a semantic scene app into a DOM container and run it.
 *
 * The app runs on `createSemanticSceneController()`. Each frame's scene goes
 * through `lowerUiSceneToBrowser()` and is patched into one root element in
 * place, keyed by `data-bijou-node-id`. Delegated events on the root become
 * action requests. Theme tokens are custom properties on the root, and
 * `options.direction` sets its `dir`. Nothing is written to the output port.
 *
 * Throws when the first scene cannot be lowered; the controller is stopped
 * first, and nothing is attached to `container`.
 */
export function mountBijouDom<Model, M>(
  app: SemanticSceneApp<Model, M>,
  container: BijouDomElement,
  options: MountBijouDomOptions<Model> = {},
): BijouDomHandle<Model, M> {
  const document = ownerDocument(container, options.document);
  const ctx = options.ctx ?? createWebContext();
  const controller = createSemanticSceneController(app, {
    ctx,
    onDiagnostic: options.onDiagnostic,
    onCrash: options.onCrash,
  });
  const root = document.createElement('div');
  const session: DomSession = { composing: new Set() };
  const patcher = createDomPatcher(document, root, session, options.focusableNodeIds ?? []);
  const syncTheme = createThemeSync(ctx, root);
  let direction: BijouDomDirection | undefined;
  const render = (frame: SemanticSceneFrame<Model>): void => {
    patcher.patch(lowerUiSceneToBrowser(frame.scene).root);
    const next = options.direction?.(frame.model);
    if (next === undefined || next === direction) return;
    root.setAttribute('dir', next);
    direction = next;
  };
  try {
    render(controller.frame());
    syncTheme();
  } catch (error: unknown) {
    controller.stop();
    throw error;
  }
  container.insertBefore(root, null);
  const frames = controller.subscribe(render);
  const theme = observeTheme(ctx, () => { syncTheme(); });
  const unbridge = bridgeDomEvents(root, {
    patcher,
    session,
    invoke: (request) => { controller.invoke(request); },
  });
  let stopped = false;
  return {
    root,
    controller,
    stop() {
      if (stopped) return;
      stopped = true;
      frames.dispose();
      theme.dispose();
      unbridge();
      controller.stop();
      if (root.parentNode === container) container.removeChild(root);
    },
  };
}
