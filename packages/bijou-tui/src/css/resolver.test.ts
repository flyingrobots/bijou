import { describe, it, expect } from 'vitest';
import { resolveStyles, matchesMediaQuery } from './resolver.js';
import { parseBCSS } from './parser.js';
import { createTokenGraph } from '../../../bijou/src/core/theme/graph.js';

describe('resolveStyles', () => {
  it('matches by type, class, and id', () => {
    const sheet = parseBCSS(`
      Badge { color: white; }
      .active { background: green; }
      #special { border: bold; }
    `);

    const styles = resolveStyles(
      { type: 'Badge', id: 'special', classes: ['active'] },
      sheet,
      { width: 80, height: 24 }
    );

    expect(styles['color']).toBe('white');
    expect(styles['background']).toBe('green');
    expect(styles['border']).toBe('bold');
  });

  it('respects specificity (ID > Class > Type)', () => {
    const sheet = parseBCSS(`
      Badge { color: red; }
      .btn { color: blue; }
      #header { color: green; }
    `);

    const identity = { type: 'Badge', id: 'header', classes: ['btn'] };
    const styles = resolveStyles(identity, sheet, { width: 80, height: 24 });

    // ID wins
    expect(styles['color']).toBe('green');
  });

  it('handles !important', () => {
    const sheet = parseBCSS(`
      #id { color: blue; }
      Badge { color: red !important; }
    `);

    const styles = resolveStyles({ type: 'Badge', id: 'id' }, sheet, { width: 80, height: 24 });
    
    // Type with !important beats ID
    expect(styles['color']).toBe('red');
  });

  it('resolves media queries', () => {
    const sheet = parseBCSS(`
      .sidebar { width: 20; }
      @media (width < 50) {
        .sidebar { display: none; }
      }
    `);

    const wide = resolveStyles({ classes: ['sidebar'] }, sheet, { width: 80, height: 24 });
    expect(wide['width']).toBe('20');
    expect(wide['display']).toBeUndefined();

    const narrow = resolveStyles({ classes: ['sidebar'] }, sheet, { width: 40, height: 24 });
    expect(narrow['display']).toBe('none');
  });

  it('resolves var() using TokenGraph', () => {
    const graph = createTokenGraph({
      palette: { brand: '#ff00ff' },
    });
    const sheet = parseBCSS('Badge { color: var(palette.brand); }');

    const styles = resolveStyles(
      { type: 'Badge' },
      sheet,
      { width: 80, height: 24 },
      graph
    );

    expect(styles['color']).toBe('#ff00ff');
  });
});

describe('matchesMediaQuery', () => {
  const terminal = { width: 80, height: 24 };

  it('handles width comparisons', () => {
    expect(matchesMediaQuery('(width < 100)', terminal)).toBe(true);
    expect(matchesMediaQuery('(width > 100)', terminal)).toBe(false);
    expect(matchesMediaQuery('(width >= 80)', terminal)).toBe(true);
  });

  it('handles height comparisons', () => {
    expect(matchesMediaQuery('(height == 24)', terminal)).toBe(true);
    expect(matchesMediaQuery('(height != 24)', terminal)).toBe(false);
  });
});
