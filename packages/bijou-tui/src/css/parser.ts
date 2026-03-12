import type { BCSSSheet, BCSSRule, BCSSSelector, BCSSDeclaration } from './types.js';

/**
 * A lightweight, zero-dependency CSS parser for Bijou TUI.
 * 
 * Supports a subset of CSS:
 * - Simple selectors: .class, #id, Type
 * - Multiple selectors: .a, .b { ... }
 * - Declarations: property: value;
 * - !important
 * - Basic media queries: @media (width < 80) { ... }
 * - Comments: /* ... * /
 */
export function parseBCSS(css: string): BCSSSheet {
  const sheet: BCSSSheet = { rules: [], mediaQueries: [] };
  
  // 1. Strip comments
  const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 2. Tokenize into blocks (rules or media queries)
  // This is a naive split that looks for { } pairs
  let pos = 0;
  while (pos < cleanCss.length) {
    const nextBrace = cleanCss.indexOf('{', pos);
    if (nextBrace === -1) break;
    
    const head = cleanCss.substring(pos, nextBrace).trim();
    
    // Find matching closing brace
    let depth = 1;
    let end = nextBrace + 1;
    while (depth > 0 && end < cleanCss.length) {
      if (cleanCss[end] === '{') depth++;
      else if (cleanCss[end] === '}') depth--;
      end++;
    }
    
    const body = cleanCss.substring(nextBrace + 1, end - 1).trim();
    
    if (head.startsWith('@media')) {
      const condition = head.replace('@media', '').trim();
      sheet.mediaQueries.push({
        condition,
        rules: parseRules(body),
      });
    } else {
      sheet.rules.push(...parseRules(head + ' { ' + body + ' }'));
    }
    
    pos = end;
  }
  
  return sheet;
}

function parseRules(css: string): BCSSRule[] {
  const rules: BCSSRule[] = [];
  
  // Look for selector { decls }
  const regex = /([^{]+)\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    const rawSelectors = match[1]!.split(',').map(s => s.trim()).filter(Boolean);
    const rawDecls = match[2]!.split(';').map(d => d.trim()).filter(Boolean);
    
    const selectors = rawSelectors.map(parseSelector);
    const declarations = rawDecls.map(parseDeclaration);
    
    rules.push({ selectors, declarations });
  }
  
  return rules;
}

function parseSelector(raw: string): BCSSSelector {
  const selector: BCSSSelector = { classes: [], raw };
  
  // Naive parser for .class, #id, Type
  // Note: Doesn't handle combined selectors like "Type.class" perfectly yet, 
  // but enough for basic TUI usage.
  
  const tokens = raw.split(/(?=[.#])/);
  for (const token of tokens) {
    if (token.startsWith('.')) {
      selector.classes.push(token.substring(1));
    } else if (token.startsWith('#')) {
      selector.id = token.substring(1);
    } else {
      selector.type = token.trim();
    }
  }
  
  return selector;
}

function parseDeclaration(raw: string): BCSSDeclaration {
  const parts = raw.split(':');
  const property = parts[0]!.trim().toLowerCase();
  let value = parts.slice(1).join(':').trim();
  
  const important = value.endsWith('!important');
  if (important) {
    value = value.replace('!important', '').trim();
  }
  
  return { property, value, important };
}
