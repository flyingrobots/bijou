import type { BijouCanvasBackend } from '@flyingrobots/bijou-web';
import { createShowcaseAtlas } from '../atlas.js';
import { createShowcasePresenters } from '../presenters.js';
import { installProbe } from '../probe.js';
import { describeProblem } from '../problems.js';
import { createShowcaseSession, type ShowcaseSession } from '../session.js';

const BACKENDS: readonly BijouCanvasBackend[] = ['webgpu', 'webgl2', 'canvas2d'];

/**
 * Mount DOGFOOD on the container, which fills the window. `?backend=webgl2`
 * chooses the backend, as on the showcase page; the browser suite reads the
 * same `window.__bijouWebGpu` probe. A failure is kept in `__bijouWebGpuError`.
 */
export function bootDogfood(container: HTMLElement): void {
  const late: { session?: ShowcaseSession } = {};
  // A new device pixel ratio changes the cell size, which a mount fixes: mount again.
  const atlas = createShowcaseAtlas(() => { void late.session?.remount(); });
  const session = createShowcaseSession(container, atlas, createShowcasePresenters(atlas.atlas));
  late.session = session;
  installProbe(session);
  const requested = new URLSearchParams(window.location.search).get('backend');
  const backend = BACKENDS.find((name) => name === requested) ?? 'auto';
  session.mountApp('dogfood', backend).catch((error: unknown) => {
    window.__bijouWebGpuError = describeProblem(error);
  });
}
