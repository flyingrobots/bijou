import { describe, expect, it } from 'vitest';
import { RE035_LAYOUT_SCOPE } from './envelope.js';

describe('RE-035 layout envelope scope', () => {
  it('records the landed cycle and deferred layout work', () => {
    expect(RE035_LAYOUT_SCOPE.design).toBe('RE-035');
    expect(RE035_LAYOUT_SCOPE.status).toBe('landed');
    expect(RE035_LAYOUT_SCOPE.included).toEqual([
      'layout-envelope',
      'constraint-negotiation',
      'stack',
      'place',
      'content-measurement-seam',
      'render-assignment-seam',
    ]);
    expect(RE035_LAYOUT_SCOPE.deferred).toEqual([
      'RE-036 text measurement and inline flow',
      'RE-037 overflow, viewports, scroll anchoring, and scrollbars',
      'RE-038 box model, chrome regions, hit testing, and focus maps',
      'RE-039 responsive variants, compression, and constraint fallbacks',
      'RE-040 accessible layout semantics',
      'WS-001 workspace tree',
    ]);
    expect(Object.isFrozen(RE035_LAYOUT_SCOPE.included)).toBe(true);
  });
});
