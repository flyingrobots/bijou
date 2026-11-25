import { describe, expect, it } from 'vitest';
import { GALLERY_DEMOS } from '../../examples/web-gpu/src/gallery/demos.js';
import { parseRoute, retiredHref, routeHref } from '../../examples/web-gpu/src/gallery/route.js';

describe('the showcase gallery registry', () => {
  it('lists DOGFOOD first and the soak bench second, each demo with an id, a title and a one-line description', () => {
    expect(GALLERY_DEMOS.map((demo) => demo.id).slice(0, 2)).toEqual(['dogfood', 'soak']);
    expect(GALLERY_DEMOS.length).toBeGreaterThan(2);
    for (const demo of GALLERY_DEMOS) {
      expect(demo.id).toMatch(/^[a-z][a-z0-9-]*$/u);
      expect(demo.title).not.toBe('');
      expect(demo.description).not.toBe('');
      expect(demo.description).not.toContain('\n');
      expect(typeof demo.load).toBe('function');
    }
  });

  it('has unique ids', () => {
    const ids = GALLERY_DEMOS.map((demo) => demo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('the gallery route', () => {
  it('is the gallery with no app, and an empty app', () => {
    expect(parseRoute('')).toEqual({ kind: 'gallery', unknown: null });
    expect(parseRoute('?backend=canvas2d')).toEqual({ kind: 'gallery', unknown: null });
    expect(parseRoute('?app=')).toEqual({ kind: 'gallery', unknown: null });
  });

  it('is a registered demo for its id, whatever else the address holds', () => {
    const route = parseRoute('?backend=webgl2&app=dogfood');
    expect(route.kind === 'demo' && route.demo.id).toBe('dogfood');
  });

  it('is the gallery with the unknown id, which is only ever shown as text', () => {
    expect(parseRoute('?app=nope')).toEqual({ kind: 'gallery', unknown: 'nope' });
    expect(parseRoute('?app=%3Cb%3E')).toEqual({ kind: 'gallery', unknown: '<b>' });
  });

  it('sends the address of an entry the gallery no longer has to the gallery, keeping the backend choice', () => {
    expect(retiredHref('?app=fun')).toBe('?');
    expect(retiredHref('?backend=canvas2d&app=fun&x=1')).toBe('?backend=canvas2d');
    expect(retiredHref('?app=fun-wormhole')).toBeNull();
    expect(retiredHref('?app=dogfood')).toBeNull();
    expect(retiredHref('?app=funny')).toBeNull();
    expect(retiredHref('')).toBeNull();
  });

  it('makes an address for a demo or the gallery that keeps the backend choice and nothing else', () => {
    expect(routeHref('dogfood', '?backend=canvas2d&app=old&x=1')).toBe('?app=dogfood&backend=canvas2d');
    expect(routeHref(null, '?backend=canvas2d&app=old')).toBe('?backend=canvas2d');
    expect(routeHref(null, '?app=old')).toBe('?');
  });
});
