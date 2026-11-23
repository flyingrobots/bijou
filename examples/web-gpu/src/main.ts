import type { BijouCanvasBackend, BijouCanvasBackendChoice } from '@flyingrobots/bijou-web';
import { REFUSED_APPS, SHOWCASE_APPS } from './apps.js';
import { createShowcaseAtlas } from './atlas.js';
import { renderHud } from './hud.js';
import { createShowcasePresenters } from './presenters.js';
import { installProbe } from './probe.js';
import { createShowcaseSession, describeProblem, type ShowcaseSession } from './session.js';

const BACKENDS: readonly BijouCanvasBackend[] = ['webgpu', 'webgl2', 'canvas2d'];
const LABELS: Record<BijouCanvasBackend, string> = { webgpu: 'WebGPU', webgl2: 'WebGL2', canvas2d: 'Canvas 2D' };

function element(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`BIJOU_WEB_GPU_MISSING_ELEMENT: ${selector}`);
  return found;
}

function button(label: string, data: Record<string, string>, onClick: () => void): HTMLButtonElement {
  const control = document.createElement('button');
  control.type = 'button';
  control.textContent = label;
  Object.assign(control.dataset, data);
  control.addEventListener('click', onClick);
  return control;
}

/** `?app=counter&backend=webgl2` choose the first mount; both default as shown. */
function initialChoice(): { readonly app: string; readonly backend: BijouCanvasBackendChoice } {
  const params = new URLSearchParams(window.location.search);
  const app = params.get('app') ?? 'counter';
  const requested = params.get('backend');
  const backend = BACKENDS.find((name) => name === requested) ?? 'auto';
  return { app, backend };
}

function wireControls(session: ShowcaseSession, resetAtlas: () => void): void {
  element('#apps').replaceChildren(
    ...SHOWCASE_APPS.map((app) => button(app.title, { app: app.id }, () => { void session.mountApp(app.id); })),
  );
  element('#backends').replaceChildren(
    ...BACKENDS.map((name) => button(LABELS[name], { backend: name }, () => { void session.switchBackend(name); })),
  );
  element('#hostile').replaceChildren(
    button('Lose the WebGL2 context', { action: 'lose-context' }, () => { void session.loseContext(); }),
    button('Reset the glyph atlas', { action: 'reset-atlas' }, resetAtlas),
  );
  element('#refused').replaceChildren(...REFUSED_APPS.map((app) => {
    const item = document.createElement('li');
    item.dataset['refused'] = app.id;
    item.textContent = `${app.title}: ${app.code}: ${app.reason}`;
    return item;
  }));
}

async function boot(): Promise<void> {
  const container = element('#surface');
  const hud = element('#hud');
  const late: { session?: ShowcaseSession } = {};
  // A new device pixel ratio changes the cell size, which a mount fixes: mount again.
  const atlas = createShowcaseAtlas(() => { void late.session?.remount(); });
  const presenters = createShowcasePresenters(atlas.atlas);
  const session = createShowcaseSession(container, atlas, presenters);
  late.session = session;
  wireControls(session, () => { void session.resetAtlas(); });
  installProbe(session);
  const choice = initialChoice();
  await session.mountApp(choice.app, choice.backend);
  const refresh = async (): Promise<void> => {
    renderHud(hud, await session.state());
  };
  await refresh();
  window.setInterval(() => { void refresh(); }, 200);
}

boot().catch((error: unknown) => {
  window.__bijouWebGpuError = describeProblem(error);
  element('#boot-error').textContent = window.__bijouWebGpuError;
});
