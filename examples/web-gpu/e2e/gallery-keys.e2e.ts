import { expect, test, type Page } from '@playwright/test';
import { expectDemoOpen, expectGalleryOnly, openGallery } from './gallery-support.js';
import { collectErrors } from './support.js';

// The gallery is a showcase page: its keys, hints and themes are the others' too.
const themeClass = (page: Page) => page.evaluate(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));

for (const scheme of ['light', 'dark'] as const) {
  test(`in the ${scheme} theme the gallery moves focus with l, opens a demo with Enter, and Esc opens the palette`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.emulateMedia({ colorScheme: scheme });
    await openGallery(page, 'backend=canvas2d');
    await expect.poll(() => themeClass(page)).toBe(scheme);
    await expect(page.locator('[data-gallery-demo] kbd, [data-gallery] kbd').first()).toBeVisible();
    await page.locator('[data-nav]').first().focus();
    // `l` moves from the header to the next region: the list of demos.
    await page.keyboard.press('l');
    const focused = () => page.evaluate(() => document.activeElement?.closest('[data-nav]')?.getAttribute('data-gallery-demo') ?? null);
    await expect.poll(focused).toBe('dogfood');
    await page.keyboard.press('Enter');
    await expectDemoOpen(page, 'dogfood');
    await page.keyboard.press('Escape');
    await expectGalleryOnly(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Commands' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('in a demo, the Esc key hint and the button return to the gallery from the chrome, and a focused Surface keeps every key', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'app=dogfood&backend=canvas2d');
  await expectDemoOpen(page, 'dogfood');
  await expect(page.getByRole('button', { name: 'Back to the gallery' }).locator('kbd')).toHaveText('Esc');
  await page.locator('#surface textarea').focus();
  await page.keyboard.press('Escape');
  expect(new URL(page.url()).searchParams.get('app')).toBe('dogfood');
  await expect(page.locator('#surface canvas')).toHaveCount(1);
  await page.getByRole('button', { name: 'Back to the gallery' }).focus();
  await page.keyboard.press('Escape');
  await expectGalleryOnly(page);
  expect(errors).toEqual([]);
});

test('the gallery switches between light and dark from its theme menu', async ({ page }) => {
  await openGallery(page, 'backend=canvas2d');
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.getByRole('button', { name: 'Theme' }).click();
  await page.getByRole('menuitemradio', { name: 'Light' }).click();
  await expect.poll(() => themeClass(page)).toBe('light');
  const light = await background();
  await page.getByRole('button', { name: 'Theme' }).click();
  await page.getByRole('menuitemradio', { name: 'Dark' }).click();
  await expect.poll(() => themeClass(page)).toBe('dark');
  expect(await background()).not.toBe(light);
});
