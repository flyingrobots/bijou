import { expect, test, type Page } from '@playwright/test';
import { collectErrors, countModel, open } from './support.js';
// The DOM probe's Window augmentation types window.__bijouDom below.
export type { DomProbe } from '../src/dom/probe.js';

declare global {
  interface Window {
    /** Keys that reached the element a Bijou mount reads its input from. */
    __reached?: string[];
  }
}

// The focus rule: while focus is inside a Bijou mount, every key goes to the
// mounted app; the page's keys act only while focus is in the chrome.

const PROBE_KEYS = ['Escape', ' ', 'h', 'j', 'k', 'l', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 't'];

async function recordKeysAt(page: Page, selector: string): Promise<void> {
  await page.evaluate((target) => {
    window.__reached = [];
    document.querySelector(target)?.addEventListener('keydown', (event) => {
      if (event instanceof KeyboardEvent) window.__reached?.push(event.key);
    });
  }, selector);
}

const palette = (page: Page) => page.getByRole('dialog', { name: 'Commands' });

test('with the Surface focused, every key reaches the Bijou app and none opens the page chrome', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page, 'app=counter&backend=canvas2d');
  await page.locator('#surface canvas').click();
  await page.keyboard.press('+');
  await expect.poll(() => countModel(page)).toBe(1);
  await recordKeysAt(page, '#surface textarea');
  // The counter's own keys: k and ArrowUp increment, j and ArrowDown decrement.
  for (const key of PROBE_KEYS) await page.keyboard.press(key);
  await expect.poll(() => page.evaluate(() => window.__reached)).toEqual(PROBE_KEYS);
  await expect.poll(() => countModel(page)).toBe(1);
  await page.keyboard.press('k');
  await expect.poll(() => countModel(page)).toBe(2);
  await expect(palette(page)).toHaveCount(0);
  await expect(page.getByRole('menu')).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement === document.querySelector('#surface textarea'))).toBe(true);
  expect(errors).toEqual([]);
});

test('in the chrome, Esc opens the command palette, its commands run, and the hints name the keys', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page, 'app=counter&backend=webgl2');
  await expect(page.locator('[data-region="keys"] kbd').filter({ hasText: 'Esc' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Reset the glyph atlas' }).focus();
  await page.keyboard.press('Escape');
  await expect(palette(page)).toBeVisible();
  await page.keyboard.type('Canvas 2D');
  await page.keyboard.press('Enter');
  await expect(palette(page)).toHaveCount(0);
  await expect(page.locator('[data-hud="backend"]')).toHaveText('Canvas 2D');
  expect(errors).toEqual([]);
});

test('in the chrome, j and k move focus through the controls and Space then t opens the theme menu', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page, 'app=counter&backend=canvas2d');
  const items = page.locator('[data-nav]');
  await items.first().focus();
  const first = await items.first().evaluate((element) => element.outerHTML);
  await page.keyboard.press('j');
  expect(await page.evaluate(() => document.activeElement?.outerHTML)).not.toBe(first);
  await page.keyboard.press('k');
  expect(await page.evaluate(() => document.activeElement?.outerHTML)).toBe(first);
  await page.keyboard.press(' ');
  await page.keyboard.press('t');
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByRole('menuitemradio', { name: 'System' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('on the DOM check page, keys typed into a mounted input stay in the input', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/dom.html');
  await page.waitForFunction(() => window.__bijouDom?.ready === true);
  const input = page.locator('[data-bijou-node-id="app.name"]');
  await input.click();
  await recordKeysAt(page, '[data-bijou-node-id="app.name"]');
  await page.keyboard.type('hjkl t');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-bijou-node-id="app.greeting"]')).toHaveText('Hello, hjkl t');
  await expect.poll(() => page.evaluate(() => window.__reached)).toEqual(['h', 'j', 'k', 'l', ' ', 't', 'Escape']);
  await expect(palette(page)).toHaveCount(0);
  await expect(page.getByRole('menu')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('on the DOM check page, a focused mounted Button gets Esc, j, k and Space, and the page acts on none of them', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/dom.html');
  await page.waitForFunction(() => window.__bijouDom?.ready === true);
  await page.locator('[data-bijou-node-id="app.increment"]').focus();
  await recordKeysAt(page, '[data-bijou-node-id="app.increment"]');
  for (const key of ['Escape', 'j', 'k', 'h', 'l', ' ', 't']) await page.keyboard.press(key);
  await expect.poll(() => page.evaluate(() => window.__reached)).toEqual(['Escape', 'j', 'k', 'h', 'l', ' ', 't']);
  // Space pressed the Button once; no key moved focus or opened the palette or the theme menu.
  await expect(page.locator('[data-bijou-node-id="app.count"]')).toHaveText('Count 1');
  await expect(palette(page)).toHaveCount(0);
  await expect(page.getByRole('menu')).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.getAttribute('data-bijou-node-id'))).toBe('app.increment');
  expect(errors).toEqual([]);
});
