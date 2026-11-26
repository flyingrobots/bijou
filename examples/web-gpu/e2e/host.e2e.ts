import { expect, test } from '@playwright/test';
import { clickInDom, domCount, expectCount, expectOnly, pressOnCanvas, switchHost } from './host-support.js';
import { collectErrors, hud, open, waitFor, witness } from './support.js';

// One app, one model, presented either as cells on a canvas or as native
// elements: the host switch stops one mount and starts the other with the
// model the first one left (flyingrobots/bijou#869).

const hostItem = (page: import('@playwright/test').Page, host: 'canvas' | 'dom') => page.locator(`[data-host="${host}"]`);

test('the dual-host counter set to 5 on the canvas shows 5 on the DOM host, takes an increment there, and the canvas then shows 6', async ({ page }, info) => {
  const errors = collectErrors(page);
  witness(page, info, await open(page, 'app=dual&backend=canvas2d'));
  await expect(hostItem(page, 'canvas')).toHaveAttribute('data-state', 'on');
  await expect(hud(page, 'host')).toHaveText('Canvas');
  await page.locator('#surface canvas').click();
  for (let press = 0; press < 5; press++) await page.keyboard.press('k');
  await expectCount(page, 'canvas', 5);

  await hostItem(page, 'dom').click();
  await waitFor(page, (current) => current.host === 'dom');
  await expect(domCount(page)).toHaveText('Count 5');
  await expect(hud(page, 'host')).toHaveText('DOM');
  // The DOM host is not "negotiating": it shows its own status, and every app is reachable in the controls.
  await expect(page.locator('[data-status="dom"]')).toHaveText('DOM · native elements');
  // The app buttons wrap inside the controls card (59c5b282): none is pushed out past its edge. The card is taller
  // than the viewport, and switching to the DOM host scrolls the page down to it, past the card's top, so the
  // check is the card's horizontal bounds, not the viewport.
  const card = await page.locator('[data-region="controls"]').boundingBox();
  expect(card).not.toBeNull();
  for (const app of await page.locator('[data-app]').all()) {
    await expect(app).toBeVisible();
    const id = await app.getAttribute('data-app');
    const box = await app.boundingBox();
    if (box === null || card === null) throw new Error(`no layout box for the ${String(id)} app button or the card`);
    expect(box.x, `${String(id)} button's left edge`).toBeGreaterThanOrEqual(card.x);
    expect(box.x + box.width, `${String(id)} button's right edge`).toBeLessThanOrEqual(card.x + card.width);
  }
  await expect(hostItem(page, 'dom')).toHaveAttribute('data-state', 'on');
  await expectOnly(page, 'dom');
  await clickInDom(page, 'app.increment');
  await expectCount(page, 'dom', 6);

  await hostItem(page, 'canvas').click();
  const back = await waitFor(page, (current) => current.host === 'canvas' && current.presents > 0 && current.frameRgbaSha256 !== null);
  witness(page, info, back);
  expect(back.backend).toBe('canvas2d');
  await expectCount(page, 'canvas', 6);
  await expectOnly(page, 'canvas');

  // The canvas shows 6: its frame is the frame of a fresh mount counted up to 6 with keys.
  await page.evaluate(() => window.__bijouWebGpu?.mountApp('dual', 'canvas2d'));
  await waitFor(page, (current) => current.app === 'dual' && current.presents > 0 && current.frameRgbaSha256 !== back.frameRgbaSha256);
  for (let press = 0; press < 6; press++) await pressOnCanvas(page, 'k');
  await expectCount(page, 'canvas', 6);
  await waitFor(page, (current) => current.frameRgbaSha256 === back.frameRgbaSha256);
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
  expect(errors).toEqual([]);
});

test('a presenter switch after a host round trip keeps the state, and the canvas comes back on the backend it left', async ({ page }, info) => {
  const errors = collectErrors(page);
  witness(page, info, await open(page, 'app=dual&backend=webgl2'));
  await pressOnCanvas(page, 'k');
  await pressOnCanvas(page, '+');
  await expectCount(page, 'canvas', 2);
  await switchHost(page, 'dom');
  await clickInDom(page, 'app.increment');
  await expectCount(page, 'dom', 3);
  await switchHost(page, 'canvas');
  await expect(hud(page, 'backend')).toHaveText('WebGL2');
  await expectCount(page, 'canvas', 3);

  await page.locator('[data-backend="canvas2d"]').click();
  witness(page, info, await waitFor(page, (current) => current.backend === 'canvas2d' && current.presents > 0));
  await expectCount(page, 'canvas', 3);
  await pressOnCanvas(page, 'k');
  await expectCount(page, 'canvas', 4);
  await switchHost(page, 'dom');
  await expect(page.locator('[data-backend="webgl2"]')).toBeDisabled();
  await expectCount(page, 'dom', 4);
  await switchHost(page, 'canvas');
  await expect(hud(page, 'backend')).toHaveText('Canvas 2D');
  await expectCount(page, 'canvas', 4);
  await expectOnly(page, 'canvas');
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
  expect(errors).toEqual([]);
});

test('an app without a scene projection offers no DOM host, and the HUD and the controls say why', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await open(page, 'app=counter&backend=canvas2d');
  for (const [title, id] of [['Counter', 'counter'], ['Components library', 'components'], ['Hero', 'hero'], ['Component showcase', 'showcase']] as const) {
    await page.getByRole('radio', { name: title, exact: true }).click();
    await waitFor(page, (current) => current.app === id && current.presents > 0);
    await expect(hostItem(page, 'dom')).toBeDisabled();
    await expect(hostItem(page, 'canvas')).toHaveAttribute('data-state', 'on');
    await expect(hud(page, 'host')).toHaveText(`Canvas (no DOM: ${title} has no scene projection)`);
    await expect(page.locator('[data-host-note]')).toHaveText(`${title} has no scene projection, so it runs on the canvas only.`);
  }
  await page.getByRole('radio', { name: 'Counter', exact: true }).click();
  await waitFor(page, (current) => current.app === 'counter' && current.presents > 0);
  await pressOnCanvas(page, 'k');
  await expectCount(page, 'canvas', 1);

  // Space then m does nothing here, and the session refuses a direct request.
  await hostItem(page, 'canvas').focus();
  await page.keyboard.press(' ');
  await page.keyboard.press('m');
  await page.evaluate(() => window.__bijouWebGpu?.switchHost('dom'));
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([
    'BIJOU_WEB_GPU_NO_SCENE: Counter has no scene projection, so it runs on the canvas only.',
  ]);
  await expect(hud(page, 'host')).toHaveText('Canvas (no DOM: Counter has no scene projection)');
  await expectCount(page, 'canvas', 1);
  await expectOnly(page, 'canvas');

  await page.getByRole('radio', { name: 'Dual-host counter', exact: true }).click();
  await waitFor(page, (current) => current.app === 'dual' && current.presents > 0);
  await expect(hostItem(page, 'dom')).toBeEnabled();
  await expect(page.locator('[data-host-note]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Space then s focuses the live host, and two quick toggles end where they began', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page, 'app=dual&backend=canvas2d');
  await pressOnCanvas(page, 'k');
  await expectCount(page, 'canvas', 1);
  // Two toggles inside one HUD poll: each picks its target on the session's queue, so they cancel out.
  await page.evaluate(() => { void window.__bijouWebGpu?.toggleHost(); return window.__bijouWebGpu?.toggleHost(); });
  await waitFor(page, (current) => current.host === 'canvas' && current.presents > 0);
  await expectCount(page, 'canvas', 1);
  await expectOnly(page, 'canvas');

  await switchHost(page, 'dom');
  await hostItem(page, 'dom').focus();
  await page.keyboard.press(' ');
  await page.keyboard.press('s');
  await expect(page.locator('#surface [data-bijou-node-id="app.increment"]')).toBeFocused();
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
  expect(errors).toEqual([]);
});

