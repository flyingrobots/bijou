/**
 * ANSI lint test — scans source files for raw ANSI escape sequences.
 *
 * Detected forms (case-insensitive where hex digits are involved):
 * - Hex: `\x1b[` / `\x1b]` (and uppercase `\x1B`)
 * - Unicode: `\u001b[` / `\u001b]` (and uppercase `\u001B`)
 * - Braced: `\u{1b}[` / `\u{1b}]` (and uppercase `\u{1B}`)
 * - Literal ESC byte (U+001B) followed by `[` or `]`
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
  'core/ansi.ts',                    // shared ANSI constants (CLEAR_LINE_RETURN, HIDE/SHOW_CURSOR)
  'core/forms/form-utils.ts',       // terminalRenderer cursor control
  'core/forms/select.ts',           // \x1b[K line-clear + key matching
  'core/forms/multiselect.ts',      // \x1b[K line-clear + key matching
  'core/forms/filter-interactive.ts', // \x1b[K line-clear + key matching
  'core/forms/textarea-editor.ts',  // \x1b[K line-clear + key/arrow matching
  'core/components/hyperlink.ts',   // OSC 8 sequences
  'core/text/clip.ts',              // ANSI-aware text clipping
  'core/text/grapheme.ts',          // ANSI strip for width measurement
  'core/render/differ.ts',          // CUP escape codes for differential rendering
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
      // Case-insensitive match for ANSI escape encodings in source:
      // - hex:     \x1b[ / \x1B] etc.
      // - unicode: \u001b[ / \u001B] etc.
      // - braced:  \u{1b}[ / \u{1B}] etc.
      // - literal: ESC byte (U+001B) followed by [ or ]
      const hasAnsiEscape =
        /(\\x1b|\\u001b|\\u\{1b\})[\[\]]/i.test(content)
        || content.includes('\x1b[') || content.includes('\x1b]');
      if (hasAnsiEscape) {
        violations.push(rel);
      }
    }

    expect(violations, `Raw ANSI escapes found in: ${violations.join(', ')}`).toEqual([]);
  });
});
