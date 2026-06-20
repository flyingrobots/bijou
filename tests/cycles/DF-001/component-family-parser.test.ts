import { describe, expect, it } from 'vitest';
import { parseComponentFamilyHeading } from '../../../examples/docs/coverage.js';

describe('component family reference parser', () => {
  it('throws a descriptive error when the heading capture is missing', () => {
    expect(() => parseComponentFamilyHeading([])).toThrow(
      'Invalid component family heading: expected capture group for "### <label>"',
    );
  });
});
