import { describe, expect, it } from 'vitest';
import { createSurface } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { renderTransition } from './app-frame-render.js';

describe('renderTransition', () => {
  const ctx = createTestContext({ mode: 'interactive' });

  it('applies surface-native cell overrides directly', () => {
    const prev = createSurface(2, 1, { char: '.', fg: '#111111', bg: '#222222', modifiers: ['dim'], empty: false });
    const next = createSurface(2, 1, { char: 'n', fg: '#aaaaaa', bg: '#bbbbbb', empty: false });

    const result = renderTransition(
      prev,
      next,
      ({ x }) => (x === 0
        ? {
          showNext: false,
          char: 'X',
          cell: { char: 'X', fg: '#ff0000', bg: '#000000', modifiers: ['bold'], empty: false },
        }
        : { showNext: true }),
      0.5,
      2,
      1,
      ctx,
      0,
    );

    expect(result.get(0, 0)).toMatchObject({
      char: 'X',
      fg: '#ff0000',
      bg: '#000000',
      modifiers: ['bold'],
      empty: false,
    });
    expect(result.get(1, 0)).toMatchObject({
      char: 'n',
      fg: '#aaaaaa',
      bg: '#bbbbbb',
      empty: false,
    });
  });

  it('keeps the selected base cell styling for plain char overrides', () => {
    const prev = createSurface(1, 1, { char: 'p', fg: '#123456', bg: '#654321', modifiers: ['underline'], empty: false });
    const next = createSurface(1, 1, { char: 'n', fg: '#abcdef', bg: '#fedcba', empty: false });

    const result = renderTransition(
      prev,
      next,
      () => ({ showNext: false, char: '░' }),
      0.5,
      1,
      1,
      ctx,
      0,
    );

    expect(result.get(0, 0)).toMatchObject({
      char: '░',
      fg: '#123456',
      bg: '#654321',
      modifiers: ['underline'],
      empty: false,
    });
  });
});
