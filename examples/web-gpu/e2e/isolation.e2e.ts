import { expect, test, type Page } from '@playwright/test';
import { collectErrors, open } from './support.js';
// The DOM probe's Window augmentation types window.__bijouDom below.
export type { DomProbe } from '../src/dom/probe.js';

// The chrome's styles stop at a Bijou mount: every element a mount creates has
// the computed style the same element has in a document with no author CSS.
// Only properties that do not inherit are compared, since a mount's elements
// inherit text colour and size from the page like any unstyled element.

/** Pairs of [element, property, mounted value, unstyled value] that differ. */
async function differences(page: Page, hostSelector: string): Promise<string[][]> {
  return page.evaluate(async (selector) => {
    const PROPERTIES = [
      'display', 'position', 'box-sizing', 'width', 'max-width', 'min-width', 'max-height', 'min-height',
      'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border-top-width', 'border-top-style', 'border-left-width', 'border-left-style',
      'border-top-left-radius', 'background-color', 'background-image', 'outline-style',
      'vertical-align', 'appearance', 'opacity', 'overflow-x', 'overflow-y', 'resize',
    ];
    const host = document.querySelector(selector);
    if (host === null) throw new Error(`no ${selector}`);
    const frame = document.createElement('iframe');
    frame.srcdoc = `<!doctype html><html><body><div id="copy">${host.innerHTML}</div></body></html>`;
    frame.style.cssText = `position:absolute;left:-10000px;width:${String(host.clientWidth)}px;height:${String(host.clientHeight)}px;border:0;`;
    const loaded = new Promise((resolve) => { frame.addEventListener('load', resolve, { once: true }); });
    document.body.append(frame);
    await loaded;
    const copy = frame.contentDocument?.querySelector('#copy');
    if (copy == null || frame.contentWindow === null) throw new Error('the reference document did not load');
    const mountedNodes = [...host.querySelectorAll('*')];
    const copiedNodes = [...copy.querySelectorAll('*')];
    const found: string[][] = [];
    mountedNodes.forEach((node, index) => {
      const twin = copiedNodes[index];
      if (twin === undefined) { found.push([node.tagName, 'missing', '', '']); return; }
      const mounted = getComputedStyle(node);
      const unstyled = frame.contentWindow?.getComputedStyle(twin);
      for (const property of PROPERTIES) {
        // A canvas or textarea sized by its own inline style is compared on every property;
        // width follows the container, which is chrome layout, and is compared by the probes instead.
        if (property === 'width') continue;
        const a = mounted.getPropertyValue(property);
        const b = unstyled?.getPropertyValue(property) ?? '';
        if (a !== b) found.push([node.tagName, property, a, b]);
      }
    });
    frame.remove();
    return found;
  }, hostSelector);
}

test('no chrome style reaches the canvas or the textarea mountBijouCanvas() creates', async ({ page }) => {
  const errors = collectErrors(page);
  await open(page, 'app=counter&backend=canvas2d');
  expect(await page.locator('#surface > *').count()).toBe(2);
  expect(await differences(page, '#surface')).toEqual([]);
  // The canvas fills the container's content box, as the mount's inline style asks.
  const fit = await page.evaluate(() => {
    const host = document.querySelector('#surface');
    const canvas = host?.querySelector('canvas');
    if (host == null || canvas == null) return null;
    return { host: [host.clientWidth, host.clientHeight], canvas: [canvas.clientWidth, canvas.clientHeight] };
  });
  expect(fit?.canvas).toEqual(fit?.host);
  expect(errors).toEqual([]);
});

test('no chrome style reaches the elements mountBijouDom() creates', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/dom.html');
  await page.waitForFunction(() => window.__bijouDom?.ready === true);
  expect(await page.locator('#dom-root *').count()).toBeGreaterThan(0);
  expect(await differences(page, '#dom-root')).toEqual([]);
  expect(errors).toEqual([]);
});
