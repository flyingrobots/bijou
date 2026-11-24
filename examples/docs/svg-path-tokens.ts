export interface PathToken {
  readonly text: string;
  readonly offset: number;
}

const PATH_TOKEN_RE = /[MLQZ]|-?(?:\d+\.?\d*|\.\d+)/y;
const SEPARATOR_RE = /[\s,]/;

export function pathError(message: string, offset: number): Error {
  return new Error(`SVG path: ${message} at offset ${String(offset)}.`);
}

export function isCommandToken(token: PathToken): boolean {
  return /^[MLQZ]$/.test(token.text);
}

/**
 * Split a path into command letters and numbers, each with its source offset.
 * Only whitespace and commas may separate tokens; any other character (a
 * lowercase command, an exponent, a sign with no digits, an unsupported
 * command letter) throws instead of vanishing. Invariant: every iteration
 * either advances `position` by at least one character or throws.
 */
export function tokenizePath(path: string): readonly PathToken[] {
  const tokens: PathToken[] = [];
  let position = 0;
  while (position < path.length) {
    const char = path.charAt(position);
    if (SEPARATOR_RE.test(char)) {
      position++;
      continue;
    }
    PATH_TOKEN_RE.lastIndex = position;
    const text = PATH_TOKEN_RE.exec(path)?.[0];
    if (text === undefined || text.length === 0) {
      throw pathError(`unsupported character ${JSON.stringify(char)}`, position);
    }
    tokens.push({ text, offset: position });
    position += text.length;
  }
  return tokens;
}
