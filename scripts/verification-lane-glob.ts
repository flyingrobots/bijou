/**
 * Glob matching for the verification-lane rules, with no dependency.
 *
 * `globToRegExp` implements the picomatch subset the rule table uses, with
 * picomatch's default `dot: false`: `*` matches within one segment, `**` as a
 * whole segment matches any number of segments, `{a,b}` alternates, and no
 * wildcard matches a segment that starts with `.`. A dot segment can only be
 * matched by a pattern that spells it, so an unexpected dot path is `unknown`.
 *
 * `shellCaseToRegExp` implements a POSIX shell `case` pattern, where `*`
 * matches across `/`. It exists only for the DOGFOOD-relevance patterns that
 * the pre-push hook and `ci.yml` still evaluate in shell.
 */

const SEGMENT = '(?!\\.)[^/]+';

function escape(text: string): string {
  return text.replace(/[.+^$()|[\]\\]/g, '\\$&');
}

function segmentToRegExp(segment: string): string {
  let source = '';
  let index = 0;
  while (index < segment.length) {
    const char = segment[index] ?? '';
    if (char === '*') {
      source += index === 0 ? '(?!\\.)[^/]*' : '[^/]*';
    } else if (char === '?') {
      source += index === 0 ? '[^/.]' : '[^/]';
    } else if (char === '{') {
      const close = segment.indexOf('}', index);
      if (close === -1) throw new Error(`unclosed brace in glob segment: ${segment}`);
      const options = segment.slice(index + 1, close).split(',');
      source += `(?:${options.map(segmentToRegExp).join('|')})`;
      index = close;
    } else {
      source += escape(char);
    }
    index += 1;
  }
  return source;
}

export function globToRegExp(pattern: string): RegExp {
  const segments = pattern.split('/');
  let source = '';
  segments.forEach((segment, index) => {
    const last = index === segments.length - 1;
    if (segment === '**') {
      source += last ? `${SEGMENT}(?:/${SEGMENT})*` : `(?:${SEGMENT}/)*`;
      return;
    }
    source += segmentToRegExp(segment) + (last ? '' : '/');
  });
  return new RegExp(`^${source}$`);
}

export function shellCaseToRegExp(pattern: string): RegExp {
  const source = escape(pattern).replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${source}$`, 's');
}
