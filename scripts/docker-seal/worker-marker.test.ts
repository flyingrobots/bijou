import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { markerRefusal } from './worker.mjs';

const roots: string[] = [];
function marker(content: string): string {
  const root = mkdtempSync(join(tmpdir(), 'seal-marker-'));
  roots.push(root);
  const path = join(root, 'bijou-sealed-tests.json');
  writeFileSync(path, content);
  return path;
}
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

// A pid no process can have: above the largest any supported kernel assigns.
const DEAD_PID = 2 ** 30;

describe('why a marked worker cannot start', () => {
  it('reports a run in progress when the marker names a live process', () => {
    const message = markerRefusal('bijou-sealed-tests', marker(JSON.stringify({ pid: process.pid })));
    expect(message).toContain('Worker already active: bijou-sealed-tests');
    expect(message).toContain(`process ${String(process.pid)}`);
    expect(message).toContain('wait for it to finish');
    expect(message).not.toContain('explicit recovery');
  });

  it('asks for explicit recovery when the recorded process is gone', () => {
    const path = marker(JSON.stringify({ pid: DEAD_PID }));
    expect(markerRefusal('bijou-sealed-tests', path)).toBe(`Worker requires explicit recovery: ${path}`);
  });

  it.each(['', 'not json', '{}', '{"pid":"12"}', '{"pid":0}', '{"pid":-4}'])(
    'asks for explicit recovery when the marker is %j',
    (content) => {
      const path = marker(content);
      expect(markerRefusal('bijou-sealed-tests', path)).toBe(`Worker requires explicit recovery: ${path}`);
    },
  );
});
