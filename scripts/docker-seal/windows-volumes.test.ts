import { describe, expect, it } from 'vitest';
import { hostVolumeInventory, parseContainerVolume, parseHostVolumes } from './windows-volumes.mjs';

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

describe('Windows container quota volume', () => {
  const containerVolume = '\\\\?\\Volume{11111111-2222-3333-4444-555555555555}\\';
  const hostVolumes = ['\\\\?\\volume{ab12cd34-0000-0000-0000-000000000000}\\'];

  it('accepts one volume GUID path that the host does not have', () => {
    expect(parseContainerVolume(JSON.stringify([containerVolume]), hostVolumes)).toBe(containerVolume);
  });

  // Oracle: hosted jobs 133850176905 and 133853580349 stopped here with one message for every predicate and no value.
  it.each([
    ['no volume', '[]', 'expected one volume, got []'],
    ['two volumes', JSON.stringify([containerVolume, containerVolume]), 'expected one volume, got ['],
    ['a non-list', '"C:"', 'expected one volume, got "C:"'],
    ['a null entry', '[null]', 'not a volume GUID path: null'],
    ['a device name', '["HarddiskVolume3"]', 'not a volume GUID path: "HarddiskVolume3"'],
    ['a host volume in another case', JSON.stringify([hostVolumes[0]?.toUpperCase()]), 'present on the host: '],
  ])('refuses %s and reports the predicate and the value', (_name, output, reason) => {
    expect(() => parseContainerVolume(output, hostVolumes))
      .toThrow(`Independent container quota volume cannot be established: ${reason}`);
  });
});
