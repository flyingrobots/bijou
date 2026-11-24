import { expect, test, type Page } from '@playwright/test';
import { collectErrors, open as openShowcase, state, waitFor } from './support.js';

// DOGFOOD on the chrome-free page: the Surface is the window. Assertions read
// the app's model through the probe, because the canvas holds pixels, not text.
interface View { readonly route: string; readonly theme: number; readonly shell: string; readonly guide: string; readonly page: string }

async function view(page: Page): Promise<View> {
  return page.evaluate(() => {
    const model: unknown = window.__bijouWebGpu?.model();
    const field = (value: unknown, name: string): unknown => (typeof value === 'object' && value !== null ? Reflect.get(value, name) : undefined);
    const docs = field(model, 'docsModel');
    const text = (value: unknown): string => (typeof value === 'string' ? value : '');
    const pageId = text(field(docs, 'activePageId'));
    const pageModel = field(field(docs, 'pageModels'), pageId);
    return {
      route: text(field(model, 'route')),
      theme: Number(field(model, 'landingThemeIndex')),
      shell: text(field(docs, 'activeShellThemeId')),
      guide: text(field(pageModel, 'selectedGuideId')),
      page: pageId,
    };
  });
}

async function open(page: Page): Promise<void> {
  await page.goto('/dogfood.html?backend=canvas2d');
  await page.waitForFunction(() => window.__bijouWebGpu?.ready === true || window.__bijouWebGpuError !== undefined);
  await waitFor(page, (current) => current.presents > 0 || current.problem !== null);
  await page.locator('#surface textarea').focus();
}

async function pressAndSettle(page: Page, key: string): Promise<void> {
  const before = (await state(page)).presents;
  await page.keyboard.press(key);
  await waitFor(page, (current) => current.presents > before);
}

const nothingWrong = async (page: Page, errors: string[]): Promise<void> => {
  expect(await state(page)).toMatchObject({ app: 'dogfood', problem: null });
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
  expect(errors).toEqual([]);
};

test('the page has nothing but the Surface, and the Surface fills the window and follows a resize', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  expect(await page.evaluate(() => document.body.querySelectorAll('#root > *').length)).toBe(1);
  const box = async () => page.locator('#surface').boundingBox();
  expect(await box()).toMatchObject({ x: 0, y: 0, width: 1280, height: 900 });
  // The app's own model holds the grid; the HUD receipt is not read while the canvas is being resized.
  const grid = async () => page.evaluate(() => {
    const model: unknown = window.__bijouWebGpu?.model();
    return typeof model === 'object' && model !== null ? `${String(Reflect.get(model, 'columns'))}x${String(Reflect.get(model, 'rows'))}` : '';
  });
  const before = await grid();
  await page.setViewportSize({ width: 800, height: 500 });
  await expect.poll(grid).not.toBe(before);
  expect(await box()).toMatchObject({ x: 0, y: 0, width: 800, height: 500 });
  // A canvas is blank between its resize and the repaint after it, and the receipt refuses a blank frame: wait for one that reads.
  await expect.poll(() => state(page).then(() => true, () => false)).toBe(true);
  await pressAndSettle(page, 'Enter');
  await nothingWrong(page, errors);
});

test('the landing screen opens the guides, a guide opens, another page opens, and the theme changes', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  expect((await view(page)).route).toBe('landing');
  await pressAndSettle(page, '2');
  expect((await view(page)).theme).toBe(1);
  await pressAndSettle(page, 'Enter');
  const docs = await view(page);
  expect(docs.route).toBe('docs');
  expect(docs.shell).toBe('cabinet-of-curiosities');
  await pressAndSettle(page, 'ArrowDown');
  await pressAndSettle(page, 'Enter');
  const guide = await view(page);
  expect(guide.guide).not.toBe('');
  await pressAndSettle(page, ']');
  expect((await view(page)).page).not.toBe(guide.page);
  await nothingWrong(page, errors);
});

test('every page opens once and each of its first guides opens, with no fault and no refused character', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page);
  await pressAndSettle(page, 'Enter');
  const seen = new Set<string>();
  for (let step = 0; step < 12; step += 1) {
    seen.add((await view(page)).page);
    for (let guide = 0; guide < 4; guide += 1) {
      await pressAndSettle(page, 'ArrowDown');
      await pressAndSettle(page, 'Enter');
      expect((await state(page)).problem).toBeNull();
    }
    await pressAndSettle(page, ']');
  }
  expect(seen.size).toBeGreaterThanOrEqual(7);
  await nothingWrong(page, errors);
});

test('the showcase page mounts DOGFOOD with ?app=dogfood', async ({ page }) => {
  const errors = collectErrors(page);
  const mounted = await openShowcase(page, 'app=dogfood&backend=canvas2d');
  expect(mounted).toMatchObject({ app: 'dogfood', problem: null });
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
  expect(errors).toEqual([]);
});
