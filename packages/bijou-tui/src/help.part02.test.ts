import { describe, it, expect } from 'vitest';
import { createKeyMap } from './keybindings.js';
import { helpShort } from './help.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Msg =
  | { type: 'quit' }
  | { type: 'help' }
  | { type: 'move'; dir: string }
  | { type: 'select' };

// ---------------------------------------------------------------------------
// helpShort
// ---------------------------------------------------------------------------

describe('helpShort', () => {
  it('renders single-line summary', () => {
    const km = createKeyMap<Msg>()
      .bind('q', 'Quit', { type: 'quit' })
      .bind('?', 'Help', { type: 'help' });

    const result = helpShort(km);
    expect(result).toBe('q Quit • ? Help');
  });

  it('hides disabled bindings by default', () => {
    const km = createKeyMap<Msg>()
      .bind('q', 'Quit', { type: 'quit' })
      .bind('?', 'Help', { type: 'help' });

    km.disable('Quit');
    expect(helpShort(km)).toBe('? Help');
  });

  it('formats modifier keys', () => {
    const km = createKeyMap<Msg>()
      .bind('ctrl+c', 'Quit', { type: 'quit' });

    expect(helpShort(km)).toBe('Ctrl+c Quit');
  });

  it('returns empty string for no bindings', () => {
    expect(helpShort(createKeyMap<Msg>())).toBe('');
  });
});
