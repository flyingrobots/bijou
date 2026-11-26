import type { BijouCanvasBackend } from '@flyingrobots/bijou-web';
import { createShowcaseAtlas } from '../atlas.js';
import { createShowcasePresenters } from '../presenters.js';
import { installProbe } from '../probe.js';
import { describeProblem } from '../problems.js';
import { createShowcaseSession, type ShowcaseSession } from '../session.js';

const BACKENDS: readonly BijouCanvasBackend[] = ['webgpu', 'webgl2', 'canvas2d'];

/** A demo running in a container; `stop()` takes everything it added to the page away again. */
export interface OpenDemo {
  stop(): void;
}

/**
 * Load the demo and mount it on `container`, which fills the window.
 * `?backend=` chooses the backend, as on the showcase page. `report` gets the
 * error that stopped it, or null once it mounted. The browser suite reads the
 * same `window.__bijouWebGpu` probe as everywhere; it exists only while the
 * demo is open, as does `__bijouWebGpuError`.
 */
export function openDemo(container: HTMLElement, id: string, search: string, report: (error: string | null) => void): OpenDemo {
  const late: { session?: ShowcaseSession } = {};
  // A new device pixel ratio changes the cell size, which a mount fixes: mount again.
  const atlas = createShowcaseAtlas(() => { void late.session?.remount(); });
  const session = createShowcaseSession(container, atlas, createShowcasePresenters(atlas.atlas));
  late.session = session;
  installProbe(session);
  const requested = new URLSearchParams(search).get('backend');
  const backend = BACKENDS.find((name) => name === requested) ?? 'auto';
  let stopped = false;
  const finish = (error: string | null): void => {
    if (stopped) return;
    if (error !== null) window.__bijouWebGpuError = error;
    report(error);
  };
  // The session keeps a failed operation instead of throwing it: read what it kept.
  session.mountApp(id, backend).then(() => { finish(session.failures().at(-1) ?? null); }, (error: unknown) => { finish(describeProblem(error)); });
  return {
    stop() {
      stopped = true;
      delete window.__bijouWebGpu;
      delete window.__bijouWebGpuError;
      delete window.__bijouSoakLog;
      // Queued behind the mount, so a demo still loading is stopped as soon as it has mounted.
      void session.unmount().then(() => { atlas.dispose(); });
    },
  };
}
