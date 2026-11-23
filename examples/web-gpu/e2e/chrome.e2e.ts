import { expect, test, type Page } from '@playwright/test';
import { collectErrors, open, waitFor } from './support.js';

// The page chrome: a theme-book theme with a light, dark and system switch
// that persists, and a layout that uses the width from a phone to a wide screen.

const themeClass = (page: Page) => page.evaluate(() => {
  const list = document.documentElement.classList;
  return list.contains('dark') ? 'dark' : list.contains('light') ? 'light' : 'none';
});

async function chooseTheme(page: Page, name: 'Light' | 'Dark' | 'System'): Promise<void> {
  await page.getByRole('button', { name: 'Theme' }).click();
  await page.getByRole('menuitemradio', { name }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
}

test('the theme follows the system by default, switches to light or dark, and keeps the choice across a reload', async ({ page }) => {
  const errors = collectErrors(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await open(page, 'app=counter&backend=canvas2d');
  await expect.poll(() => themeClass(page)).toBe('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => themeClass(page)).toBe('light');
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  await chooseTheme(page, 'Dark');
  await expect.poll(() => themeClass(page)).toBe('dark');
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(light);
  await page.reload();
  await waitFor(page, (current) => current.presents > 0);
  await expect.poll(() => themeClass(page)).toBe('dark');
  await page.getByRole('button', { name: 'Theme' }).click();
  await expect(page.getByRole('menuitemradio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');

  await chooseTheme(page, 'System');
  await expect.poll(() => themeClass(page)).toBe('light');
  await page.reload();
  await expect.poll(() => themeClass(page)).toBe('light');
  expect(errors).toEqual([]);
});

type Box = { x: number; y: number; width: number; height: number };
async function region(page: Page, name: string): Promise<Box> {
  const box = await page.locator(`[data-region="${name}"]`).boundingBox();
  if (box === null) throw new Error(`the ${name} region has no box`);
  return box;
}
const noHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('at phone width the regions stack in one column with no horizontal scroll, and the grid fits the canvas', async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const current = await open(page, 'app=counter&backend=canvas2d');
  expect(await noHorizontalScroll(page)).toBe(true);
  const surface = await region(page, 'surface');
  const controls = await region(page, 'controls');
  const hud = await region(page, 'hud');
  expect(controls.y).toBeGreaterThanOrEqual(surface.y + surface.height);
  expect(hud.y).toBeGreaterThanOrEqual(controls.y + controls.height);
  expect(Math.abs(controls.x - surface.x)).toBeLessThan(1);
  const box = await page.locator('#surface canvas').boundingBox();
  if (box === null || current.grid === null) throw new Error('nothing is mounted');
  expect(current.grid.cols).toBe(Math.floor(Math.round(box.width * current.dpr) / current.cellPx.width));
  expect(errors).toEqual([]);
});

test('on an extra-wide screen the Surface, the controls and the HUD sit side by side across the width', async ({ page }) => {
  const errors = collectErrors(page);
  await page.setViewportSize({ width: 2560, height: 1440 });
  await open(page, 'app=counter&backend=canvas2d');
  expect(await noHorizontalScroll(page)).toBe(true);
  const surface = await region(page, 'surface');
  const controls = await region(page, 'controls');
  const hud = await region(page, 'hud');
  expect(Math.abs(controls.y - surface.y)).toBeLessThan(1);
  expect(Math.abs(hud.y - surface.y)).toBeLessThan(1);
  expect(controls.x).toBeGreaterThanOrEqual(surface.x + surface.width);
  expect(hud.x).toBeGreaterThanOrEqual(controls.x + controls.width);
  // The regions fill the width: what is left is the page padding.
  expect(hud.x + hud.width - surface.x).toBeGreaterThan(2560 * 0.9);
  expect(errors).toEqual([]);
});

test('with no WebGPU adapter and no WebGL2 context the fallback reasons are shown in an alert', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, 'gpu');
    const original: unknown = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext')?.value;
    if (typeof original !== 'function') throw new Error('HTMLCanvasElement has no getContext');
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value(this: HTMLCanvasElement, type: string, options?: unknown): unknown {
        return type === 'webgl2' ? null : Reflect.apply(original, this, [type, options]);
      },
    });
  });
  await open(page, 'app=counter&backend=auto');
  const alert = page.locator('[data-fallback]');
  await expect(alert).toHaveAttribute('data-slot', 'alert');
  await expect(alert.locator('[data-fallback-reason="webgpu"]')).toContainText('WebGPU: GEORDI_E_BIJOU_BACKEND_UNAVAILABLE');
  await expect(alert.locator('[data-fallback-reason="webgl2"]')).toContainText('WebGL2: GEORDI_E_BIJOU_BACKEND_UNAVAILABLE');
  expect(errors).toEqual([]);
});
