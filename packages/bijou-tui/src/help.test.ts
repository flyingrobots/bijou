import { describe, it, expect } from 'vitest';
import { surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createKeyMap } from './keybindings.js';
import {
  helpView,
  helpViewSurface,
  helpShort,
  helpShortSurface,
  helpFor,
  helpForSurface,
} from './help.js';

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
// helpView
// ---------------------------------------------------------------------------

describe('helpView', () => {
  it('renders grouped bindings', () => {
    const result = helpView(sampleKeyMap());

    expect(result).toContain('Navigation');
    expect(result).toContain('j');
    expect(result).toContain('Move down');
    expect(result).toContain('General');
    expect(result).toContain('q');
    expect(result).toContain('Quit');
  });

  it('aligns keys to the same column', () => {
    const km = createKeyMap<Msg>()
      .bind('q', 'Quit', { type: 'quit' })
      .bind('ctrl+c', 'Force quit', { type: 'quit' });

    const result = helpView(km);
    const lines = result.split('\n').filter((l) => l.startsWith('  '));
    // Both content lines should have the description at the same column
    const descStart0 = lines[0].indexOf('Quit');
    const descStart1 = lines[1].indexOf('Force quit');
    // The key padding means descriptions won't start at wildly different columns
    // Ctrl+c is 6 chars, q is 1 char — both padded to 6
    expect(descStart0).toBe(descStart1);
  });

  it('hides disabled bindings by default', () => {
    const km = sampleKeyMap();
    km.disable('Quit');

    const result = helpView(km);
    expect(result).not.toContain('Quit');
  });

  it('shows disabled bindings when enabledOnly is false', () => {
    const km = sampleKeyMap();
    km.disable('Quit');

    const result = helpView(km, { enabledOnly: false });
    expect(result).toContain('Quit');
  });

  it('renders title when provided', () => {
    const result = helpView(sampleKeyMap(), { title: 'Keyboard Shortcuts' });
    const lines = result.split('\n');
    expect(lines[0]).toBe('Keyboard Shortcuts');
    expect(lines[1]).toBe('');
  });

  it('returns empty string when no bindings match', () => {
    const km = createKeyMap<Msg>();
    expect(helpView(km)).toBe('');
  });

  it('uses custom separator', () => {
    const km = createKeyMap<Msg>()
      .bind('q', 'Quit', { type: 'quit' });

    const result = helpView(km, { separator: ' → ' });
    expect(result).toContain('q → Quit');
  });

  it('ungrouped bindings appear under General', () => {
    const km = createKeyMap<Msg>()
      .bind('q', 'Quit', { type: 'quit' });

    expect(helpView(km)).toContain('General');
  });

  it('uses a localized fallback group label when provided', () => {
    const km = createKeyMap<Msg>()
      .bind('q', 'Quit', { type: 'quit' });

    expect(helpView(km, { defaultGroupName: 'Général' })).toContain('Général');
  });
});

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

describe('help surfaces', () => {
  const ctx = createTestContext();

  it('helpViewSurface matches grouped text output', () => {
    const rendered = surfaceToString(
      helpViewSurface(sampleKeyMap(), { title: 'Keyboard Shortcuts' }),
      ctx.style,
    );

    expect(rendered.split('\n').map((line) => line.trimEnd()).join('\n'))
      .toBe(helpView(sampleKeyMap(), { title: 'Keyboard Shortcuts' }));
  });

  it('helpShortSurface honors width and keeps the single-line hint', () => {
    const rendered = surfaceToString(
      helpShortSurface(sampleKeyMap(), { width: 32 }),
      ctx.style,
    );

    expect(rendered).toBe(helpShort(sampleKeyMap()).padEnd(32, ' '));
  });

  it('helpForSurface matches filtered grouped text output', () => {
    const rendered = surfaceToString(
      helpForSurface(sampleKeyMap(), 'Nav'),
      ctx.style,
    );

    expect(rendered.split('\n').map((line) => line.trimEnd()).join('\n'))
      .toBe(helpFor(sampleKeyMap(), 'Nav'));
  });

  it('falls back for non-finite width and height', () => {
    const rendered = surfaceToString(
      helpViewSurface(sampleKeyMap(), {
        width: Number.NaN,
        height: Number.POSITIVE_INFINITY,
      }),
      ctx.style,
    );

    expect(rendered.split('\n').map((line) => line.trimEnd()).join('\n'))
      .toBe(helpView(sampleKeyMap()));
  });
});
