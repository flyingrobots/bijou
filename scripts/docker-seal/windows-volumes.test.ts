import { describe, expect, it } from 'vitest';
import { hostVolumeInventory, parseHostVolumes } from './windows-volumes.mjs';

describe('Windows host volume inventory', () => {
  it('outlasts the hosted runner that needed more than 15 seconds', () => {
    // Oracle: hosted job 133819686830 was still running the inventory when its 15 s deadline expired.
    expect(hostVolumeInventory.timeout).toBeGreaterThanOrEqual(60000);
  });

  it('stays bounded well inside the 30 minute session deadline', () => {
    expect(hostVolumeInventory.timeout).toBeLessThanOrEqual(120000);
  });

  it('reports under a stage label the bootstrap accepts', () => {
    // Oracle: the label pattern enforced by windowsStage.
    expect(hostVolumeInventory.label).toMatch(/^[a-z][a-z0-9-]{0,63}$/);
  });

  it('normalizes volume identifiers to lower case for comparison', () => {
    const output = JSON.stringify(['\\\\?\\Volume{AB12CD34-0000-0000-0000-000000000000}\\']);
    expect(parseHostVolumes(output)).toEqual(['\\\\?\\volume{ab12cd34-0000-0000-0000-000000000000}\\']);
  });

  it.each([['an empty list', '[]'], ['a non-list', '"C:"'], ['a non-string entry', '["C:", 7]'], ['null', 'null']])(
    'refuses %s as an inventory',
    (_name, output) => {
      expect(() => parseHostVolumes(output)).toThrow('Host volume inventory unavailable');
    },
  );
});
