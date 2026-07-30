import { describe, expect, it } from 'vitest';
import { validateLiveFileContextBaseline } from './file-context-baseline-contract.js';

describe('WF-165 live file/context baseline contract', () => {
  it('rejects missing, stale, and newly-small baseline entries', () => {
    const recorded = {
      schema: 'code-dojo.file-context-baseline.v1',
      maxLines: 1,
      maxBytes: 1,
      files: [{ path: 'large.ts', lines: 2, bytes: 2 }],
    } as const;

    expect(() => {
      validateLiveFileContextBaseline(recorded, () => undefined);
    }).toThrow(/missing/u);
    expect(() => {
      validateLiveFileContextBaseline(recorded, () => 'changed\n');
    }).toThrow(/stale/u);
    expect(() => {
      validateLiveFileContextBaseline(
        { ...recorded, maxLines: 2, maxBytes: 2 },
        () => 'x\n',
      );
    }).toThrow(/threshold/u);
  });
});
