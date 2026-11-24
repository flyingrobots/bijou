import { expect, test, type Page } from '@playwright/test';
import { countListeners, expectDemoOpen, expectGalleryOnly, openGallery } from './gallery-support.js';
import { collectErrors } from './support.js';

// The soak bench as a gallery demo. Its log lines, one per scenario, are what
// the page keeps in memory; the last scenario of the table is `soak`.
const FIRST = 'paint-ascii';
const LAST = 'soak';
const BACK = { name: 'Back to the gallery' } as const;

declare global {
  interface Window { __bijouSoakLog?: () => readonly string[] }
}

const scenarios = (page: Page): Promise<string[]> => page.evaluate(() => (window.__bijouSoakLog?.() ?? []).map((line): string => {
  const entry: unknown = JSON.parse(line);
  return typeof entry === 'object' && entry !== null ? String(Reflect.get(entry, 'scenario')) : '';
}));

test('the bench opens from the gallery, shows no resident memory, and returns to the gallery cleanly', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'backend=canvas2d');
  await expect(page.locator('[data-gallery-demo="soak"]')).toContainText('soak');
  await page.locator('[data-gallery-demo="soak"]').click();
  await expectDemoOpen(page, 'soak');
  await page.getByRole('button', BACK).click();
  await expectGalleryOnly(page);
  expect(await page.evaluate(() => window.__bijouSoakLog === undefined)).toBe(true);
  expect(errors).toEqual([]);
});

test('one full cycle at a fixed grid walks every scenario in order, with zero console errors', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await openGallery(page, 'app=soak&cycles=1&dwell=0.3&fps=30&backend=canvas2d');
  await expectDemoOpen(page, 'soak');
  await expect.poll(async () => (await scenarios(page)).at(-1), { timeout: 90_000 }).toBe(LAST);
  const walked = await scenarios(page);
  expect(walked[0]).toBe(FIRST);
  expect(new Set(walked).size).toBe(walked.length);
  const lines = await page.evaluate(() => window.__bijouSoakLog?.() ?? []);
  for (const line of lines) expect(line).not.toContain('rssMB');
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
  await page.getByRole('button', BACK).click();
  await expectGalleryOnly(page);
  expect(errors).toEqual([]);
});

test('the first scenario is chosen by the address', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'app=soak&scenario=flame&cycles=1&dwell=0.3&backend=canvas2d');
  await expectDemoOpen(page, 'soak');
  await expect.poll(async () => (await scenarios(page))[0], { timeout: 30_000 }).toBe('flame');
  expect(errors).toEqual([]);
});

test('an invalid value is refused with a message, and the gallery stays usable', async ({ page }) => {
  await openGallery(page, 'app=soak&cycles=0&backend=canvas2d');
  const failure = page.locator('[data-demo-error]');
  await expect(failure).toBeVisible();
  await expect(failure).toContainText('cycles');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', BACK).click();
  await expect(page.locator('[data-gallery-demo="soak"]')).toBeVisible();
});

test('a window resized while a scenario runs re-fits the grid with no error', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'app=soak&dwell=2&backend=canvas2d');
  await expectDemoOpen(page, 'soak');
  await page.setViewportSize({ width: 900, height: 600 });
  await page.waitForTimeout(800);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(800);
  await expect(page.locator('#surface canvas')).toHaveCount(1);
  expect(await page.evaluate(() => window.__bijouWebGpu?.failures())).toEqual([]);
  expect(errors).toEqual([]);
});

test('opening and closing the bench ten times leaves one canvas while open, none after, and a stable listener count', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectErrors(page);
  await countListeners(page);
  await openGallery(page, 'backend=canvas2d');
  const visit = async (): Promise<void> => {
    await page.locator('[data-gallery-demo="soak"]').click();
    await expectDemoOpen(page, 'soak');
    await page.getByRole('button', BACK).click();
    await expectGalleryOnly(page);
  };
  await visit();
  await visit();
  const count = (): Promise<number> => page.evaluate(() => window.__listenerCount?.() ?? -1);
  await page.waitForTimeout(500);
  const baseline = await count();
  for (let round = 0; round < 8; round += 1) {
    await visit();
    await expect.poll(count).toBe(baseline);
  }
  expect(errors).toEqual([]);
});
