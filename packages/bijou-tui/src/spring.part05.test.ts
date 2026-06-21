import { describe, it, expect } from 'vitest';
import { resolveTweenConfig, EASINGS } from './spring.js';

describe('resolveTweenConfig', () => {
  it('applies defaults for from/to/ease', () => {
    const config = resolveTweenConfig({ duration: 500 });
    expect(config.from).toBe(0);
    expect(config.to).toBe(1);
    expect(config.duration).toBe(500);
    expect(config.ease).toBe(EASINGS.easeOutCubic);
  });
});
