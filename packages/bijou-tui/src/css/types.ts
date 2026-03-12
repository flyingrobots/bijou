/**
 * AST types for Bijou CSS (BCSS).
 */

export interface BCSSDeclaration {
  property: string;
  value: string;
  important: boolean;
}

export interface BCSSSelector {
  type?: string;    // e.g. 'Badge'
  id?: string;      // e.g. 'header'
  classes: string[]; // e.g. ['sidebar', 'active']
  raw: string;
}

export interface BCSSRule {
  selectors: BCSSSelector[];
  declarations: BCSSDeclaration[];
}

export interface BCSSMediaQuery {
  condition: string; // e.g. '(width < 80)'
  rules: BCSSRule[];
}

export interface BCSSSheet {
  rules: BCSSRule[];
  mediaQueries: BCSSMediaQuery[];
}
