import { describe, it, expect } from 'vitest';
import { createKeyMap } from './keybindings.js';
import { helpFor } from './help.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Msg =
  | { type: 'quit' }
  | { type: 'help' }
  | { type: 'move'; dir: string }
  | { type: 'select' };

function sampleKeyMap() {
  return createKeyMap<Msg>()
    .group('Navigation', (g) => g
      .bind('j', 'Move down', { type: 'move', dir: 'down' })
      .bind('k', 'Move up', { type: 'move', dir: 'up' }),
    )
    .bind('q', 'Quit', { type: 'quit' })
    .bind('?', 'Toggle help', { type: 'help' });
}

// ---------------------------------------------------------------------------
// helpFor
// ---------------------------------------------------------------------------

describe('helpFor', () => {
  it('filters by group prefix', () => {
    const km = sampleKeyMap();

    const result = helpFor(km, 'Nav');
    expect(result).toContain('Move down');
    expect(result).toContain('Move up');
    expect(result).not.toContain('Quit');
  });

  it('is case-insensitive', () => {
    const km = sampleKeyMap();

    const result = helpFor(km, 'nav');
    expect(result).toContain('Move down');
  });

  it('returns empty string for non-matching group', () => {
    const km = sampleKeyMap();

    expect(helpFor(km, 'Editing')).toBe('');
  });
});
