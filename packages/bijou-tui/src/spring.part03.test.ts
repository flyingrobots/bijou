import { describe, it, expect } from 'vitest';
import { resolveSpringConfig, SPRING_PRESETS } from './spring.js';

describe('resolveSpringConfig', () => {
  it('returns default when called with no args', () => {
    expect(resolveSpringConfig()).toEqual(SPRING_PRESETS.default);
  });

  it('resolves a preset name', () => {
    expect(resolveSpringConfig('wobbly')).toEqual(SPRING_PRESETS.wobbly);
  });

  it('merges partial config with defaults', () => {
    const config = resolveSpringConfig({ stiffness: 300 });
    expect(config.stiffness).toBe(300);
    expect(config.damping).toBe(SPRING_PRESETS.default.damping);
  });
});
