import { readDocumentationFile as readFileSync } from '../../../scripts/documentation-corpus.js';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../../..');

function read(path: string): string {
  return readFileSync(resolve(ROOT, path), 'utf8');
}

function normalized(path: string): string {
  return read(path).replace(/\s+/g, ' ').trim();
}

describe('WF-167 roadmap milestone authority', () => {

  it('records the authority and no-unmilestoned contracts', () => {
    const design = normalized('docs/design/WF-167-roadmap-milestone-authority.md');
    expect(design).toContain('Expected open items after triage: `26`');
    expect(design).toContain('No versioned issue retains `[Beyond]` in its title.');
  });
});
