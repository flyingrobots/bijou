/**
 * Finds the Node host globals a module names: free references to `process`
 * and `Buffer`, and reads of them through `globalThis`, `global`, `window` or
 * `self`. The input is an ESTree program, as `parseAst()` from Vite returns.
 *
 * A module that declares its own binding of one of the names anywhere is
 * treated as shadowing it everywhere. That can miss a use, never invent one.
 */
export const HOST_GLOBALS = ['process', 'Buffer'] as const;
type HostGlobal = (typeof HOST_GLOBALS)[number];

const GLOBAL_OBJECTS = new Set(['globalThis', 'global', 'window', 'self']);
const NOT_A_REFERENCE: Readonly<Record<string, readonly string[]>> = {
  MemberExpression: ['property'],
  Property: ['key'],
  MethodDefinition: ['key'],
  PropertyDefinition: ['key'],
  LabeledStatement: ['label'],
  BreakStatement: ['label'],
  ContinueStatement: ['label'],
  ImportSpecifier: ['imported'],
  ExportSpecifier: ['exported'],
  MetaProperty: ['meta', 'property'],
};

interface AstNode {
  readonly type: string;
  readonly [field: string]: unknown;
}

function isNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string';
}

function isHostGlobal(name: unknown): name is HostGlobal {
  return HOST_GLOBALS.some((host) => host === name);
}

function children(node: AstNode): [string, AstNode][] {
  return Object.entries(node).flatMap(([field, value]): [string, AstNode][] => {
    if (Array.isArray(value)) return value.filter(isNode).map((child) => [field, child]);
    return isNode(value) ? [[field, value]] : [];
  });
}

/** Names a binding pattern declares. */
function bound(pattern: unknown): string[] {
  if (!isNode(pattern)) return [];
  switch (pattern.type) {
    case 'Identifier': return typeof pattern['name'] === 'string' ? [pattern['name']] : [];
    case 'AssignmentPattern': return bound(pattern['left']);
    case 'RestElement': return bound(pattern['argument']);
    case 'Property': return bound(pattern['value']);
    case 'ArrayPattern':
    case 'ObjectPattern': return children(pattern).filter(([field]) => field !== 'decorators').flatMap(([, child]) => bound(child));
    default: return [];
  }
}

function declared(node: AstNode): string[] {
  switch (node.type) {
    case 'VariableDeclarator': return bound(node['id']);
    case 'CatchClause': return bound(node['param']);
    case 'ImportSpecifier':
    case 'ImportDefaultSpecifier':
    case 'ImportNamespaceSpecifier': return bound(node['local']);
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression': {
      const params = Array.isArray(node['params']) ? node['params'].flatMap(bound) : [];
      return [...bound(node['id']), ...params];
    }
    case 'ClassDeclaration':
    case 'ClassExpression': return bound(node['id']);
    default: return [];
  }
}

function globalRead(node: AstNode): unknown {
  if (node.type !== 'MemberExpression' || !isNode(node['object']) || !isNode(node['property'])) return undefined;
  const object = node['object'];
  if (object.type !== 'Identifier' || !GLOBAL_OBJECTS.has(String(object['name']))) return undefined;
  const property = node['property'];
  return node['computed'] === true ? property['value'] : property['name'];
}

/** The host globals `program` names, in the order the names are declared above. */
export function hostGlobalsIn(program: unknown): HostGlobal[] {
  const used = new Set<HostGlobal>();
  const shadowed = new Set<string>();
  const visit = (node: AstNode, parent: AstNode | undefined, field: string): void => {
    for (const name of declared(node)) shadowed.add(name);
    const skipped = parent !== undefined && parent['computed'] !== true && (NOT_A_REFERENCE[parent.type] ?? []).includes(field);
    if (node.type === 'Identifier' && !skipped && isHostGlobal(node['name'])) used.add(node['name']);
    const read = globalRead(node);
    if (isHostGlobal(read)) used.add(read);
    for (const [childField, child] of children(node)) visit(child, node, childField);
  };
  if (isNode(program)) visit(program, undefined, '');
  return HOST_GLOBALS.filter((name) => used.has(name) && !shadowed.has(name));
}
