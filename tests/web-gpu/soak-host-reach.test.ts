import { describe, expect, it } from 'vitest';
import { hostReachOf } from '../helpers/host-reach.js';

// The soak bench's app module and everything it imports, resolved as the
// showcase bundles it. The Node adapter is the one module allowed to reach Node.
describe('the soak bench app module reaches no Node host API', () => {
  it.each([
    ['app', 'bench/src/soak-app.ts'],
    ['options and ports', 'bench/src/soak-ports.ts'],
    ['scenario table', 'bench/src/soak-config.ts'],
  ])('%s (%s) reaches none', async (_name, module) => {
    expect(await hostReachOf(module)).toEqual([]);
  });

  it('the Node adapter is the one soak module that reaches Node, and the test adapter', async () => {
    const reach = await hostReachOf('bench/src/soak-node.ts');
    expect(reach).toContain('node:fs imported by bench/src/soak-node.ts');
    expect(reach.filter((line) => line.includes(' bench/')).every((line) => line.endsWith(' bench/src/soak-node.ts'))).toBe(true);
  });
});
