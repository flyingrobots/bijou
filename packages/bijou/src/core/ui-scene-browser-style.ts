import type { UiNode } from './ui-scene-contract.js';

const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/iu;

/**
 * Lowers layout intent to unitless custom properties and resolved token
 * colors to color declarations. The host style sheet chooses the units.
 * The scene hash has already refused a layout number that is not finite.
 */
export function browserNodeStyle(
  node: UiNode,
  tokenColors: Readonly<Record<string, string>> | undefined,
): string | undefined {
  const declarations = [
    ...layoutDeclaration('--bijou-x', node.layout?.x),
    ...layoutDeclaration('--bijou-y', node.layout?.y),
    ...layoutDeclaration('--bijou-width', node.layout?.width),
    ...layoutDeclaration('--bijou-height', node.layout?.height),
    ...colorDeclaration('color', node.style?.fg?.token, tokenColors),
    ...colorDeclaration('background-color', node.style?.bg?.token, tokenColors),
    ...colorDeclaration('border-color', node.style?.border?.token, tokenColors),
  ];
  return declarations.length === 0 ? undefined : declarations.join(';');
}

function layoutDeclaration(
  property: string,
  value: number | undefined,
): readonly string[] {
  return value === undefined ? [] : [`${property}:${String(value)}`];
}

function colorDeclaration(
  property: string,
  token: string | undefined,
  tokenColors: Readonly<Record<string, string>> | undefined,
): readonly string[] {
  if (token == null || tokenColors == null) return [];
  if (!Object.hasOwn(tokenColors, token)) return [];
  const color: unknown = tokenColors[token];
  if (typeof color !== 'string' || !HEX_COLOR.test(color)) {
    throw new Error(
      `Cannot lower ui-scene-ir/1 token ${token} to geordi-browser: ${String(color)} is not a hex color.`,
    );
  }
  return [`${property}:${color}`];
}
