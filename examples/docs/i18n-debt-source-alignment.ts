import ts from 'typescript';

export function isAlignmentOptionLiteral(node: ts.Node): boolean {
  if (!ts.isStringLiteralLike(node)) return false;
  const property = node.parent;
  if (!ts.isPropertyAssignment(property)
    || !ts.isStringLiteralLike(property.initializer)
    || (property.initializer !== node && property.name !== node)) {
    return false;
  }
  if (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name)) {
    return false;
  }
  if (property.name.text === 'hAlign') {
    return ['left', 'center', 'right'].includes(property.initializer.text);
  }
  if (property.name.text === 'vAlign') {
    return ['top', 'middle', 'bottom'].includes(property.initializer.text);
  }
  return false;
}
