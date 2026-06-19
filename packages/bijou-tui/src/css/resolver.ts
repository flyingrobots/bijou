import type { BCSSSheet, BCSSRule, BCSSSelector } from './types.js';
import type { TokenGraph, ThemeMode } from '@flyingrobots/bijou';

/**
 * Metadata for a component used to match CSS selectors.
 */
export interface ComponentIdentity {
  type?: string;
  id?: string;
  classes?: string[];
}

/**
 * Resolved styles for a component.
 */
export type ResolvedStyles = Record<string, string>;

/**
 * Resolves the final styles for a component based on a CSS sheet and terminal dimensions.
 * 
 * @param identity - The component's identity (type, id, classes).
 * @param sheet - The parsed BCSS sheet.
 * @param terminal - Current terminal dimensions for media query matching.
 * @param graph - The TokenGraph for resolving var() references.
 * @param mode - The theme mode (light/dark).
 * @returns A record of computed style properties.
 */
export function resolveStyles(
  identity: ComponentIdentity,
  sheet: BCSSSheet,
  terminal: { width: number; height: number },
  graph?: TokenGraph,
  mode: ThemeMode = 'dark'
): ResolvedStyles {
  const matchedRules: { rule: BCSSRule; specificity: number }[] = [];

  for (const rule of sheet.rules) {
    const specificity = getMatchSpecificity(identity, rule.selectors);
    if (specificity > 0) {
      matchedRules.push({ rule, specificity });
    }
  }

  for (const mq of sheet.mediaQueries) {
    if (matchesMediaQuery(mq.condition, terminal)) {
      for (const rule of mq.rules) {
        const specificity = getMatchSpecificity(identity, rule.selectors);
        if (specificity > 0) {
          matchedRules.push({ rule, specificity: specificity + 0.1 });
        }
      }
    }
  }

  matchedRules.sort((a, b) => a.specificity - b.specificity);

  const finalStyles: ResolvedStyles = {};
  for (const { rule } of matchedRules) {
    for (const decl of rule.declarations) {
      if (decl.important || !isImportant(finalStyles, decl.property)) {
        finalStyles[decl.property] = resolveValue(decl.value, graph, mode);
        if (decl.important) {
          finalStyles[`__important_${decl.property}`] = 'true';
        }
      }
    }
  }

  return finalStyles;
}

/**
 * Resolve a CSS value, handling var(token.path) references via the TokenGraph.
 */
function resolveValue(value: string, graph?: TokenGraph, mode: ThemeMode = 'dark'): string {
  if (!graph) return value;

  const varRegex = /var\(([^)]+)\)/g;
  
  return value.replace(varRegex, (_match: string, path: unknown) => {
    if (typeof path !== 'string') return 'inherit';
    try {
      const resolved = graph.get(path.trim(), mode);
      return resolved.hex;
    } catch {
      return 'inherit';
    }
  });
}

function isImportant(styles: ResolvedStyles, property: string): boolean {
  return styles[`__important_${property}`] === 'true';
}

/**
 * Calculate match specificity for a component identity against a set of selectors.
 * Returns 0 if no match, otherwise a positive number representing specificity.
 */
function getMatchSpecificity(identity: ComponentIdentity, selectors: BCSSSelector[]): number {
  let maxSpecificity = 0;

  for (const selector of selectors) {
    let match = true;
    let specificity = 0;

    // Type match
    if (selector.type && selector.type !== '*') {
      if (identity.type !== selector.type) match = false;
      specificity += 1;
    }

    // ID match
    if (selector.id) {
      if (identity.id !== selector.id) match = false;
      specificity += 100;
    }

    // Class match (all classes in selector must be present on component)
    if (selector.classes.length > 0) {
      for (const cls of selector.classes) {
        if (!identity.classes?.includes(cls)) {
          match = false;
          break;
        }
      }
      specificity += selector.classes.length * 10;
    }

    if (match) {
      maxSpecificity = Math.max(maxSpecificity, specificity);
    }
  }

  return maxSpecificity;
}

/**
 * Evaluate a basic media query condition like "(width < 80)" or "(height >= 24)".
 */
export function matchesMediaQuery(condition: string, terminal: { width: number; height: number }): boolean {
  const regex = /\((width|height)\s*(<|>|<=|>=|==|!=)\s*(\d+)\)/;
  const match = regex.exec(condition);
  if (!match) return false;

  const propertyName = match[1];
  const op = match[2];
  const rawValue = match[3];
  if ((propertyName !== 'width' && propertyName !== 'height') || op === undefined || rawValue === undefined) {
    return false;
  }

  const property = propertyName === 'width' ? terminal.width : terminal.height;
  const value = Number.parseInt(rawValue, 10);

  switch (op) {
    case '<': return property < value;
    case '>': return property > value;
    case '<=': return property <= value;
    case '>=': return property >= value;
    case '==': return property === value;
    case '!=': return property !== value;
    default: return false;
  }
}
