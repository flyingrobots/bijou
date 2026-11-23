import { expect, test, type Page } from '@playwright/test';
import type { ControlsModel } from '../src/dom/controls-app.js';
import { collectErrors } from './support.js';
// The probe's Window augmentation types the page.evaluate() calls below.
export type { DomProbe } from '../src/dom/main.js';

async function model(page: Page): Promise<ControlsModel> {
  return page.evaluate(() => {
    const probe = window.__bijouDom;
    if (probe === undefined) throw new Error('the DOM probe is not installed');
    return probe.model();
  });
}

const node = (page: Page, id: string) => page.locator(`[data-bijou-node-id="${id}"]`);

// The live-Chromium check of mountBijouDom() (DOM-27): native elements, one
// dispatch per activation, and an input that keeps its element, focus and
// selection across the re-render its own typing causes, including an IME commit.
test('mountBijouDom() in Chromium: one dispatch per activation, and typing or composing keeps the input element, focus and selection', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/dom.html');
  await page.waitForFunction(() => window.__bijouDom?.ready === true);

  // The roles became native elements.
  await expect(node(page, 'app.increment')).toHaveJSProperty('tagName', 'BUTTON');
  await expect(node(page, 'app.name')).toHaveJSProperty('tagName', 'INPUT');
  await expect(node(page, 'app.enabled')).toHaveJSProperty('tagName', 'BUTTON');

  // A real click dispatches once.
  await node(page, 'app.increment').click();
  await expect(node(page, 'app.count')).toHaveText('Count 1');
  expect(await model(page)).toMatchObject({ count: 1, dispatches: 1 });

  // Enter and Space on the focused Button each dispatch exactly once.
  await node(page, 'app.increment').focus();
  await page.keyboard.press('Enter');
  await expect(node(page, 'app.count')).toHaveText('Count 2');
  await page.keyboard.press('Space');
  await expect(node(page, 'app.count')).toHaveText('Count 3');
  expect(await model(page)).toMatchObject({ count: 3, dispatches: 3 });

  // Typing re-renders the scene; the input stays the same element, focused, with its caret.
  const input = node(page, 'app.name');
  await input.click();
  await page.evaluate(() => { window.__previousInput = document.querySelector('[data-bijou-node-id="app.name"]'); });
  await page.keyboard.type('abcd');
  await expect(node(page, 'app.greeting')).toHaveText('Hello, abcd');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.type('X');
  await expect(node(page, 'app.greeting')).toHaveText('Hello, abXcd');
  const after = await page.evaluate(() => {
    const element = document.querySelector('[data-bijou-node-id="app.name"]');
    const field = element instanceof HTMLInputElement ? element : null;
    return {
      same: element === window.__previousInput,
      active: document.activeElement === element,
      value: field?.value,
      selection: [field?.selectionStart, field?.selectionEnd],
    };
  });
  expect(after).toEqual({ same: true, active: true, value: 'abXcd', selection: [3, 3] });
  // Five keystrokes, five dispatches; nothing else ran.
  expect(await model(page)).toMatchObject({ name: 'abXcd', count: 3, dispatches: 8 });

  // IME composition through the DevTools protocol: composing dispatches nothing, the commit once.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.imeSetComposition', { text: 'に', selectionStart: 1, selectionEnd: 1 });
  await cdp.send('Input.imeSetComposition', { text: 'にほ', selectionStart: 2, selectionEnd: 2 });
  expect(await model(page)).toMatchObject({ name: 'abXcd', dispatches: 8 });
  await cdp.send('Input.insertText', { text: '日本' });
  await expect(node(page, 'app.greeting')).toHaveText('Hello, abX日本cd');
  const composed = await page.evaluate(() => {
    const element = document.querySelector('[data-bijou-node-id="app.name"]');
    const field = element instanceof HTMLInputElement ? element : null;
    return { same: element === window.__previousInput, active: document.activeElement === element, selection: [field?.selectionStart, field?.selectionEnd] };
  });
  expect(composed).toEqual({ same: true, active: true, selection: [5, 5] });
  expect(await model(page)).toMatchObject({ name: 'abX日本cd', dispatches: 9 });

  // The switch is a switch for assistive technology, and toggles once per click.
  await expect(node(page, 'app.enabled')).toHaveAttribute('role', 'switch');
  await expect(node(page, 'app.enabled')).toHaveAttribute('aria-checked', 'true');
  const switchElement = await node(page, 'app.enabled').elementHandle();
  await node(page, 'app.enabled').click();
  await expect(node(page, 'app.enabled')).toHaveText('Off');
  await expect(node(page, 'app.enabled')).toHaveAttribute('aria-checked', 'false');
  expect(await model(page)).toMatchObject({ enabled: false, dispatches: 10 });
  await node(page, 'app.enabled').click();
  await expect(node(page, 'app.enabled')).toHaveAttribute('aria-checked', 'true');
  expect(await switchElement?.evaluate((element) => element === document.querySelector('[data-bijou-node-id="app.enabled"]'))).toBe(true);
  expect(await model(page)).toMatchObject({ enabled: true, dispatches: 11 });

  expect(await page.evaluate(() => window.__bijouDom?.diagnostics)).toEqual([]);
  await page.evaluate(() => { window.__bijouDom?.stop(); });
  await expect(page.locator('#dom-root > *')).toHaveCount(0);
  expect(errors).toEqual([]);
});
