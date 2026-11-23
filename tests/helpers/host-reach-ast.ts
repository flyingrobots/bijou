import { children, isNode, scopeBindings, type AstNode } from './host-reach-scope.js';

/**
 * Finds the Node host globals a module names: free references to `process`
 * and `Buffer`, and reads of them through `globalThis`, `global`, `window` or
 * `self`. The input is an ESTree program, as `parseSync()` from Vite returns.
 *
 * Each reference resolves through its enclosing scopes (program, function,
 * block, `for` head, `catch`), with `var` hoisted to its function. A name is
 * free when no enclosing scope binds it. `with` and direct `eval` are not
 * modelled; neither occurs in an ES module, which is strict.
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

function isHostGlobal(name: unknown): name is HostGlobal {
  return HOST_GLOBALS.some((host) => host === name);
}

/** The property a member expression reads from a free global object, if it does. */
function globalRead(node: AstNode, free: (name: string) => boolean): unknown {
  if (node.type !== 'MemberExpression' || !isNode(node['object']) || !isNode(node['property'])) return undefined;
  const object = node['object'];
  const name = object['name'];
  if (object.type !== 'Identifier' || typeof name !== 'string' || !GLOBAL_OBJECTS.has(name) || !free(name)) return undefined;
  const property = node['property'];
  return node['computed'] === true ? property['value'] : property['name'];
}

/** The host globals `program` names, in the order the names are declared above. */
export function hostGlobalsIn(program: unknown): HostGlobal[] {
  const used = new Set<HostGlobal>();
  const visit = (node: AstNode, parent: AstNode | undefined, field: string, scopes: readonly ReadonlySet<string>[]): void => {
    const own = scopeBindings(node);
    const chain = own === undefined ? scopes : [...scopes, own];
    const free = (name: string): boolean => !chain.some((scope) => scope.has(name));
    const skipped = parent !== undefined && parent['computed'] !== true && (NOT_A_REFERENCE[parent.type] ?? []).includes(field);
    const name = node['name'];
    if (node.type === 'Identifier' && !skipped && isHostGlobal(name) && free(name)) used.add(name);
    const read = globalRead(node, free);
    if (isHostGlobal(read)) used.add(read);
    for (const [childField, child] of children(node)) visit(child, node, childField, chain);
  };
  if (isNode(program)) visit(program, undefined, '', []);
  return HOST_GLOBALS.filter((host) => used.has(host));
}
