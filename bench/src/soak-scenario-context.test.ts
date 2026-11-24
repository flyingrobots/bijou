import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { displayScenarios } from './soak-config.js';
import { createNodeSoakHost } from './soak-node.js';
import { initScenario } from './soak-scenarios.js';

function contextOf(state: unknown): unknown {
  if (typeof state !== 'object' || state === null || !('ctx' in state)) throw new Error('scenario state holds no context');
  return state.ctx;
}

describe('the context a soak scenario renders with', () => {
  const dir = mkdtempSync(join(tmpdir(), 'soak-context-'));
  afterAll(() => { rmSync(dir, { recursive: true, force: true }); });
  const host = createNodeSoakHost([`--out=${join(dir, 'soak.jsonl')}`]);
  const index = displayScenarios.findIndex((s) => s.id === 'component-app');
  const appCtx = createTestContext({ mode: 'interactive' });

  it('with the Node adapter is an interactive test context, and not the app context', () => {
    const received = contextOf(initScenario(host, index, 0, 80, 24).scenarioState);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(received).toMatchObject({ mode: 'interactive' });
    expect(received).not.toBe(appCtx);
    expect(received).not.toBe(host.scenarioContext());
  });

  it('is built afresh for every setup, as the scenario fallback built one', () => {
    const first = contextOf(initScenario(host, index, 0, 80, 24).scenarioState);
    const second = contextOf(initScenario(host, index, 0, 80, 24).scenarioState);
    expect(first).not.toBe(second);
  });
});
