import { describe, expect, it } from 'vitest';
import { compileTimeline } from './timeline-compile.js';
import type { BuilderEntry, TrackDef } from './timeline-contract.js';

describe('timeline duplicate validation', () => {
  it('rejects a duplicate name before resolving its track definition', () => {
    const entries: readonly BuilderEntry[] = [
      {
        kind: 'track',
        name: 'position',
        def: { type: 'tween', from: 0, to: 1, duration: 100 },
      },
      {
        kind: 'track',
        name: 'position',
        get def(): TrackDef {
          throw new Error('duplicate definition must not be resolved');
        },
      },
    ];

    expect(() => compileTimeline(entries))
      .toThrow('Timeline: duplicate track name "position"');
  });
});
