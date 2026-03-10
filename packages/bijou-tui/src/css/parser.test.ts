import { describe, it, expect } from 'vitest';
import { parseBCSS } from './parser.js';

describe('parseBCSS', () => {
  it('parses basic rules', () => {
    const css = `
      .sidebar {
        width: 20;
        color: #fff;
      }
      #header {
        height: 1;
      }
    `;
    const sheet = parseBCSS(css);
    
    expect(sheet.rules).toHaveLength(2);
    expect(sheet.rules[0]!.selectors[0]!.classes).toContain('sidebar');
    expect(sheet.rules[0]!.declarations).toHaveLength(2);
    expect(sheet.rules[0]!.declarations[0]!.property).toBe('width');
    expect(sheet.rules[0]!.declarations[0]!.value).toBe('20');
    expect(sheet.rules[1]!.selectors[0]!.id).toBe('header');
  });

  it('parses multiple selectors', () => {
    const css = 'Badge, .label { color: red; }';
    const sheet = parseBCSS(css);
    
    expect(sheet.rules[0]!.selectors).toHaveLength(2);
    expect(sheet.rules[0]!.selectors[0]!.type).toBe('Badge');
    expect(sheet.rules[0]!.selectors[1]!.classes).toContain('label');
  });

  it('handles !important', () => {
    const css = '.high { color: blue !important; }';
    const sheet = parseBCSS(css);
    expect(sheet.rules[0]!.declarations[0]!.important).toBe(true);
    expect(sheet.rules[0]!.declarations[0]!.value).toBe('blue');
  });

  it('parses media queries', () => {
    const css = `
      @media (width < 80) {
        .sidebar { display: none; }
      }
    `;
    const sheet = parseBCSS(css);
    
    expect(sheet.mediaQueries).toHaveLength(1);
    expect(sheet.mediaQueries[0]!.condition).toBe('(width < 80)');
    expect(sheet.mediaQueries[0]!.rules[0]!.selectors[0]!.classes).toContain('sidebar');
  });

  it('strips comments', () => {
    const css = `
      /* header style */
      #header { height: 1; }
    `;
    const sheet = parseBCSS(css);
    expect(sheet.rules).toHaveLength(1);
    expect(sheet.rules[0]!.selectors[0]!.id).toBe('header');
  });
});
