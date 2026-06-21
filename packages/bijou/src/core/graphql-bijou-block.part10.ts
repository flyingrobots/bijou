

export function normalizeSourceName(sourceName: string): string {
  const trimmed = sourceName.trim();
  if (trimmed.length === 0) {
    throw new Error('GraphQL Bijou block sourceName cannot be empty.');
  }
  if (
    trimmed.startsWith('/')
    || trimmed.startsWith('\\\\')
    || trimmed.startsWith('//')
    || /^[A-Za-z]:[\\/]/.test(trimmed)
    || trimmed.includes('\0')
  ) {
    throw new Error('GraphQL Bijou block sourceName must be a relative or logical name.');
  }
  return trimmed;
}
export function stripGraphqlLineComment(line: string): string {
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < line.length; index++) {
    const char = line.charAt(index);
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && char === '#') {
      return line.slice(0, index);
    }
  }
  return line;
}
