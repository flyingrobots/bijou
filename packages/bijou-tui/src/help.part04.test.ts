import { describe, it, expect } from 'vitest';
import { surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { createKeyMap } from './keybindings.js';
import { helpView, helpViewSurface, helpShort, helpShortSurface, helpFor, helpForSurface } from './help.js';

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
