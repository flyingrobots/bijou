/**
 * ANSI lint test — scans source files for raw `\x1b[` / `\x1b]` escapes.
 *
 * Raw ANSI escapes should only appear in files that legitimately need
 * terminal control, key matching, or ANSI parsing. All other styling
 * must go through {@link StylePort}.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Files allowed to contain raw ANSI escapes (relative to packages/bijou/src/).
 *
 * Audit: review when files are added/removed or ANSI usage changes.
 * Each entry should have a brief justification comment.
 */
const ALLOWED = new Set([
  'core/forms/form-utils.ts',       // terminalRenderer cursor control
  'core/forms/select.ts',           // \x1b[K line-clear + key matching
  'core/forms/multiselect.ts',      // \x1b[K line-clear + key matching
  'core/forms/filter.ts',           // \x1b[K line-clear + key matching
  'core/forms/textarea.ts',         // \x1b[K line-clear + key/arrow matching
  'core/components/progress.ts',    // cursor control
  'core/components/spinner.ts',     // cursor control
  'core/components/hyperlink.ts',   // OSC 8 sequences
  'core/components/table.ts',       // ANSI strip regex
  'core/components/dag.ts',         // ANSI strip regex
  'core/text/clip.ts',              // ANSI-aware text clipping
  'core/text/grapheme.ts',          // ANSI strip for width measurement
  'adapters/test/assertions.ts',    // assertion helpers reference ANSI patterns
]);

/** Recursively collect all `.ts` files, excluding `.test.ts` and `.d.ts`. */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (
      entry.name.endsWith('.ts')
      && !entry.name.endsWith('.test.ts')
      && !entry.name.endsWith('.d.ts')
    ) {
      results.push(full);
    }
  }
  return results;
}

const SRC_ROOT = join(__dirname, '../../src');

describe('ANSI lint', () => {
  it('no raw ANSI escapes in non-allowed source files', () => {
    const files = collectSourceFiles(SRC_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      // Normalize to forward slashes for cross-platform allowlist matching
      const rel = relative(SRC_ROOT, file).replace(/\\/g, '/');
      if (ALLOWED.has(rel)) continue;

      const content = readFileSync(file, 'utf-8');
      // Match common ANSI escape encodings in source:
      // - hex form:     \x1b[ / \x1b]
      // - unicode form: \u001b[ / \u001b] / \u{1b}[ / \u{1b}]
      // - literal ESC byte (U+001B) followed by [ or ]
      const hasAnsiEscape =
        content.includes('\\x1b[') || content.includes('\\x1b]')
        || content.includes('\\u001b[') || content.includes('\\u001b]')
        || content.includes('\\u{1b}[') || content.includes('\\u{1b}]')
        || content.includes('\x1b[') || content.includes('\x1b]');
      if (hasAnsiEscape) {
        violations.push(rel);
      }
    }

    expect(violations, `Raw ANSI escapes found in: ${violations.join(', ')}`).toEqual([]);
  });
});
