import { describe, expect, it } from 'vitest';
import { read } from './ratchet-contract-support.js';

describe('WF-165 image-viewer message contract', () => {
  it('does not retain the unproduced toggle-mode message', () => {
    const contract = read(
      'examples/image-viewer/image-viewer-contract.ts',
    );
    const update = read('examples/image-viewer/image-viewer-update.ts');

    expect(contract).not.toContain('toggle-mode');
    expect(update).not.toContain('toggle-mode');
  });
});
