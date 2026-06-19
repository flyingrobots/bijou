export function capture(match: RegExpMatchArray, index: number, context: string): string {
  const value = match[index];
  if (value == null) throw new Error(`Internal GraphQL parser error: missing ${context}.`);
  return value;
}

export function parseGraphqlStringArg(rawValue: string): string {
  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (typeof parsed === 'string') return parsed;
  } catch {
    // Re-throw with the parser's stable public error message below.
  }
  throw new Error(`Invalid GraphQL Bijou block string argument: ${rawValue}`);
}
