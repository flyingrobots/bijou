import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { chunkOf, focusSurface, funCards, nextFrame } from './gallery-fun-support.js';
import { expectDemoOpen, expectGalleryOnly, openGallery } from './gallery-support.js';
import { collectErrors, mounted, state, waitFor } from './support.js';

// The addresses of the fun demos' pages: unknown and retired ones, a chunk that fails, history, and what a page downloads.
const BACK = { name: 'Back to the gallery' } as const;

test('an unknown fun demo shows the gallery with a message that names it', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'app=fun-nope&backend=canvas2d');
  await expectGalleryOnly(page);
  await expect(page.locator('[data-gallery-message]')).toContainText('fun-nope');
  expect(errors).toEqual([]);
});

test('the old address of the combined entry opens the gallery, with no message and no error, and leaves no visit behind', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'backend=canvas2d');
  await openGallery(page, 'app=fun&backend=canvas2d');
  await expectGalleryOnly(page);
  await expect(page.locator('[data-gallery-message]')).toHaveCount(0);
  await expect.poll(() => new URL(page.url()).searchParams.get('app')).toBeNull();
  expect(new URL(page.url()).searchParams.get('backend')).toBe('canvas2d');
  const [first = ''] = await funCards(page);
  await page.locator(`[data-gallery-demo="${first}"]`).click();
  await expectDemoOpen(page, first);
  await page.goBack();
  await expectGalleryOnly(page);
  expect(new URL(page.url()).searchParams.get('app')).toBeNull();
  expect(errors).toEqual([]);
});

test('a fun demo whose chunk cannot load shows the error in the page, and the other demos still open', async ({ page }) => {
  const manifest: unknown = JSON.parse(readFileSync(new URL('../dist/.vite/manifest.json', import.meta.url), 'utf8'));
  const chunk = chunkOf(manifest, '../fun/demos/wormhole.ts');
  await page.route(`**/${chunk}`, (route) => route.abort());
  await openGallery(page, 'app=fun-wormhole&backend=canvas2d');
  const failure = page.locator('[data-demo-error]');
  await expect(failure).toBeVisible();
  await expect(failure).toContainText('Failed to fetch dynamically imported module');
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', BACK).click();
  await page.locator('[data-gallery-demo="fun-metaballs"]').click();
  await expectDemoOpen(page, 'fun-metaballs');
  await page.getByRole('button', BACK).click();
  await page.unroute(`**/${chunk}`);
  await page.locator('[data-gallery-demo="fun-wormhole"]').click();
  await expectDemoOpen(page, 'fun-wormhole');
});

test('opening a demo downloads its own chunk and no other fun demo\'s', async ({ page }) => {
  const manifest: unknown = JSON.parse(readFileSync(new URL('../dist/.vite/manifest.json', import.meta.url), 'utf8'));
  const keys = typeof manifest === 'object' && manifest !== null ? Object.keys(manifest).filter((key) => key.startsWith('../fun/demos/')) : [];
  const chunks = new Map(keys.map((key) => [chunkOf(manifest, key), key]));
  const fetched: string[] = [];
  page.on('request', (request) => {
    const module = [...chunks].find(([file]) => request.url().endsWith(file))?.[1];
    if (module !== undefined) fetched.push(module);
  });
  await openGallery(page, 'backend=canvas2d');
  await expectGalleryOnly(page);
  expect(fetched).toEqual([]);
  await page.locator('[data-gallery-demo="fun-wormhole"]').click();
  await expectDemoOpen(page, 'fun-wormhole');
  expect([...new Set(fetched)]).toEqual(['../fun/demos/wormhole.ts']);
});

test('the back and forward buttons move between two demos, each alone on the page', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'backend=canvas2d');
  await page.locator('[data-gallery-demo="fun-wormhole"]').click();
  await expectDemoOpen(page, 'fun-wormhole');
  await page.getByRole('button', BACK).click();
  await page.locator('[data-gallery-demo="fun-metaballs"]').click();
  await expectDemoOpen(page, 'fun-metaballs');
  await page.goBack();
  await expectGalleryOnly(page);
  await page.goBack();
  await expectDemoOpen(page, 'fun-wormhole');
  expect(await mounted(page)).toMatchObject({ canvases: 1, textareas: 1 });
  await page.goForward();
  await expectGalleryOnly(page);
  await page.goForward();
  await expectDemoOpen(page, 'fun-metaballs');
  expect(await mounted(page)).toMatchObject({ canvases: 1, textareas: 1 });
  expect(errors).toEqual([]);
});

test('a backend switch while a demo runs keeps the demo, still advancing', async ({ page }) => {
  const errors = collectErrors(page);
  await openGallery(page, 'app=fun-metaballs&backend=webgl2');
  await expectDemoOpen(page, 'fun-metaballs');
  await focusSurface(page);
  await page.evaluate(() => window.__bijouWebGpu?.switchBackend('canvas2d'));
  await waitFor(page, (current) => current.backend === 'canvas2d' && current.presents > 0);
  expect((await state(page)).app).toBe('fun-metaballs');
  expect(await mounted(page)).toMatchObject({ canvases: 1, textareas: 1 });
  await nextFrame(page, (await state(page)).frameRgbaSha256);
  expect(errors).toEqual([]);
});
