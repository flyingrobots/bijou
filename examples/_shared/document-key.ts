// The repository-relative key of a document that DOGFOOD names by a path
// relative to `examples/docs`, worked out from the text alone: a bundle moves
// `import.meta.url`, so no host may rely on it.
const BASE = ['examples', 'docs'];

export function exampleDocsKey(path: string): string {
  const parts = [...BASE];
  for (const part of path.split('/')) {
    if (part === '..') parts.pop();
    else if (part !== '.' && part !== '') parts.push(part);
  }
  return parts.join('/');
}
