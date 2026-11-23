import { expect, test } from '@playwright/test';
import { collectErrors, COUNTER_DIGIT, countModel, ink, cellPixels, open, waitFor, witness } from './support.js';

// WebGPU runs only where the browser exposes an adapter. Without one this case
// is skipped as capability-refused, never passed; hosted Linux runners have none.
test('counter on WebGPU draws the same frame as WebGL2 and takes a key', async ({ page }, info) => {
  const errors = collectErrors(page);
  await page.goto('/?app=counter&backend=canvas2d');
  const adapter = await page.evaluate(async () => {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    return gpu === undefined ? null : await gpu.requestAdapter();
  });
  info.annotations.push({ type: 'webgpu-adapter', description: adapter === null ? 'none: capability-refused' : 'present' });
  test.skip(adapter === null, 'This browser exposes no WebGPU adapter (capability-refused).');
  const webgl2 = await open(page, 'app=counter&backend=webgl2');
  const webgl2Frame = await waitFor(page, (current) => current.frameRgbaSha256 !== null && current.presents === webgl2.presents);
  const webgpu = await open(page, 'app=counter&backend=webgpu');
  const probed = await waitFor(page, (current) => current.backend === 'webgpu' && current.evidenceLevel !== null);
  witness(page, info, probed);
  expect(webgpu.problem).toBeNull();
  expect(probed.evidenceLevel).toMatch(/^(gpu|software)-probed$/u);
  expect(probed.frameRgbaSha256).toBe(webgl2Frame.frameRgbaSha256);
  await page.locator('#surface canvas').click();
  await page.keyboard.press('+');
  await expect.poll(() => countModel(page)).toBe(1);
  expect(ink(await cellPixels(page, COUNTER_DIGIT.col, COUNTER_DIGIT.row))).toBeGreaterThan(0);

  // Switches dispose WebGPU presenters while the HUD may be reading one back.
  for (let round = 0; round < 10; round++) {
    await page.evaluate(async () => {
      const probe = window.__bijouWebGpu;
      await Promise.all([probe?.state(), probe?.switchBackend('webgl2'), probe?.state(), probe?.switchBackend('webgpu'), probe?.state()]);
    });
  }
  await waitFor(page, (current) => current.backend === 'webgpu' && current.evidenceLevel !== null);
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
  await expect(page.locator('#boot-error')).toHaveText('');
  expect(errors).toEqual([]);
});
