import { describe, expect, it } from 'vitest';
import { loadSolo } from '../examples/fun/browser.js';
import type { FontPort } from '../examples/fun/demos/typeface.js';
import { funContext } from './helpers/fun-demos.js';
import { fixtureCatalog } from './helpers/fun-fixture.js';
import { rowText } from './helpers/fun-stub.js';

const port: FontPort = () => Promise.reject(new Error('this test supplies no font'));

function firstRow(app: ReturnType<Awaited<ReturnType<typeof loadSolo>>['build']>): string {
  const view = app.view(app.init()[0]);
  if (!('cells' in view)) throw new Error('the page must paint a Surface');
  return rowText(view, 0);
}

describe('the browser entry loads one demo for a page', () => {
  it('loads the entry it is given, and no other', async () => {
    const { entries, log } = fixtureCatalog();
    const [, second] = entries;
    if (second === undefined) throw new Error('the fixture is too small');
    const built = await loadSolo(second, 7, port);
    expect(log.loads.map((load) => load.id)).toEqual(['beta']);
    expect(firstRow(built.build(funContext(40, 10)))).toContain('demo beta');
  });

  it('mounts the demo with the seed the page chose', async () => {
    const { entries, log } = fixtureCatalog(['alpha']);
    const [only] = entries;
    if (only === undefined) throw new Error('the fixture is empty');
    const built = await loadSolo(only, 4242, port);
    expect(log.mounts).toEqual([]);
    built.build(funContext(40, 10)).init();
    expect(log.mounts).toEqual([{ id: 'alpha', seed: 4242 }]);
  });

  it('hands the demo the font port it was given', async () => {
    const { entries, log } = fixtureCatalog(['alpha']);
    const [only] = entries;
    if (only === undefined) throw new Error('the fixture is empty');
    await loadSolo(only, 1, port);
    expect(log.loads).toHaveLength(1);
    expect(log.loads[0]?.host.font).toBe(port);
  });

  it('rejects when the demo module fails to load', async () => {
    const broken = { id: 'broken', name: 'Broken', description: 'Never loads', load: () => Promise.reject(new Error('chunk missing')) };
    await expect(loadSolo(broken, 1, port)).rejects.toThrow('chunk missing');
  });
});
