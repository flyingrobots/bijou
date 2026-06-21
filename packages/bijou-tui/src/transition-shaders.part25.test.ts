import { describe, it, expect } from 'vitest';
import { TRANSITION_SHADERS, type BuiltinTransition } from './transition-shaders.js';

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

describe('TRANSITION_SHADERS', () => {
  it('maps none to undefined', () => {
    expect(TRANSITION_SHADERS.none).toBeUndefined();
  });

  it('maps all built-in names to shader functions', () => {
    const names: BuiltinTransition[] = [
      'wipe', 'dissolve', 'grid', 'fade', 'melt', 'matrix', 'scramble',
      'radial', 'diamond', 'spiral', 'blinds', 'curtain', 'pixelate',
      'typewriter', 'glitch', 'static',
    ];
    for (const name of names) {
      expect(typeof TRANSITION_SHADERS[name]).toBe('function');
    }
  });

  it('has exactly 17 entries', () => {
    expect(Object.keys(TRANSITION_SHADERS)).toHaveLength(17);
  });
});
