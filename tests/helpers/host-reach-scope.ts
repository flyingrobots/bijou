/** ESTree nodes as `parseSync()` from Vite returns them, and the bindings each scope declares. */
export interface AstNode {
  readonly type: string;
  readonly [field: string]: unknown;
}

export function isNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string';
}

export function children(node: AstNode): [string, AstNode][] {
  return Object.entries(node).flatMap(([field, value]): [string, AstNode][] => {
    if (Array.isArray(value)) return value.filter(isNode).map((child) => [field, child]);
    return isNode(value) ? [[field, value]] : [];
  });
}

const nodes = (value: unknown): AstNode[] => (Array.isArray(value) ? value.filter(isNode) : []);
const FUNCTIONS = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

/** Names a binding pattern declares. */
export function bound(pattern: unknown): string[] {
  if (!isNode(pattern)) return [];
  switch (pattern.type) {
    case 'Identifier': return typeof pattern['name'] === 'string' ? [pattern['name']] : [];
    case 'AssignmentPattern': return bound(pattern['left']);
    case 'RestElement': return bound(pattern['argument']);
    case 'Property': return bound(pattern['value']);
    case 'ArrayPattern': return nodes(pattern['elements']).flatMap(bound);
    case 'ObjectPattern': return nodes(pattern['properties']).flatMap(bound);
    default: return [];
  }
}

const declaratorNames = (declaration: AstNode): string[] => nodes(declaration['declarations']).flatMap((d) => bound(d['id']));

/** Block-scoped names a statement list declares directly: let, const, class, function and imports. */
function lexical(statements: readonly AstNode[]): string[] {
  return statements.flatMap((statement): string[] => {
    switch (statement.type) {
      case 'VariableDeclaration': return statement['kind'] === 'var' ? [] : declaratorNames(statement);
      case 'FunctionDeclaration':
      case 'ClassDeclaration': return bound(statement['id']);
      case 'ImportDeclaration': return nodes(statement['specifiers']).flatMap((s) => bound(s['local']));
      case 'ExportNamedDeclaration':
      case 'ExportDefaultDeclaration': return isNode(statement['declaration']) ? lexical([statement['declaration']]) : [];
      default: return [];
    }
  });
}

/** `var` names declared anywhere under `node`, outside nested functions. */
function hoisted(node: AstNode): string[] {
  return children(node).flatMap(([, child]) => {
    if (FUNCTIONS.has(child.type)) return [];
    const own = child.type === 'VariableDeclaration' && child['kind'] === 'var' ? declaratorNames(child) : [];
    return [...own, ...hoisted(child)];
  });
}

/** The names `node` binds for the code inside it, when it is a scope. */
export function scopeBindings(node: AstNode): ReadonlySet<string> | undefined {
  switch (node.type) {
    case 'Program': return new Set([...lexical(nodes(node['body'])), ...hoisted(node)]);
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression': {
      const own = node.type === 'FunctionExpression' ? bound(node['id']) : [];
      const body = isNode(node['body']) ? hoisted(node['body']) : [];
      return new Set([...own, ...nodes(node['params']).flatMap(bound), ...body]);
    }
    case 'BlockStatement':
    case 'StaticBlock': return new Set(lexical(nodes(node['body'])));
    case 'SwitchStatement': return new Set(lexical(nodes(node['cases']).flatMap((c) => nodes(c['consequent']))));
    case 'ForStatement':
    case 'ForInStatement':
    case 'ForOfStatement': {
      const head = node.type === 'ForStatement' ? node['init'] : node['left'];
      return new Set(isNode(head) ? lexical([head]) : []);
    }
    case 'CatchClause': return new Set(bound(node['param']));
    case 'ClassExpression': return new Set(bound(node['id']));
    default: return undefined;
  }
}
