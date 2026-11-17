import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { disposeCanaryWorkspace } from './smoke-canaries.part02.js';

const roots: string[] = [];
function canaryWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'canary-dispose-'));
  roots.push(root);
  const workspace = join(root, 'generated-tui');
  mkdirSync(join(workspace, 'node_modules'), { recursive: true });
  writeFileSync(join(workspace, 'node_modules', 'installed.js'), 'x');
  return workspace;
}

afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe('canary workspace disposal', () => {
  it('releases a passed canary install before the next canary installs', () => {
    const workspace = canaryWorkspace();
    disposeCanaryWorkspace(workspace, false);
    expect(existsSync(workspace)).toBe(false);
  });

  it('keeps the workspace when temp retention was requested', () => {
    const workspace = canaryWorkspace();
    disposeCanaryWorkspace(workspace, true);
    expect(existsSync(join(workspace, 'node_modules', 'installed.js'))).toBe(true);
  });
});
