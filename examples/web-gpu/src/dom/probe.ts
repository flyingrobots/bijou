import { mountBijouDom } from '@flyingrobots/bijou-web';
import { createControlsApp, type ControlsModel } from './controls-app.js';

/** What the browser suite reads through `window.__bijouDom`. */
export interface DomProbe {
  readonly ready: true;
  model(): ControlsModel;
  /** Diagnostics the controller reported, such as `action-not-declared`. */
  readonly diagnostics: readonly string[];
  stop(): void;
}

declare global {
  interface Window {
    __bijouDom?: DomProbe;
  }
}

/** Mount the DOM check app into the host the chrome rendered, and install the probe. */
export function mountDomCheck(container: HTMLElement): void {
  const diagnostics: string[] = [];
  // A real document and element, passed where mountBijouDom() takes its structural interfaces.
  const handle = mountBijouDom(createControlsApp(), container, {
    document,
    focusableNodeIds: ['app.increment', 'app.name', 'app.enabled'],
    onDiagnostic: (diagnostic) => { diagnostics.push(diagnostic.code); },
  });
  window.__bijouDom = {
    ready: true,
    model: () => handle.controller.frame().model,
    diagnostics,
    stop: () => { handle.stop(); },
  };
}
