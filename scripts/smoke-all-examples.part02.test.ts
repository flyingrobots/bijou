import { describe, expect, it } from 'vitest';
import { buildSmokeScenarios } from './smoke-all-examples-lib.js';

describe('buildSmokeScenarios', () => {
  it('classifies TUI targets onto TTY launchers and plain scripts onto pipe mode', () => {
    const scenarios = buildSmokeScenarios(
      '/repo',
      ['examples/plain/main.ts', 'examples/tui/main.ts'],
      (path) => path.endsWith('examples/tui/main.ts')
        ? 'import "@flyingrobots/bijou-tui";'
        : 'console.log("plain");',
    );

    const baseScenarios = scenarios.filter((scenario) => scenario.mode !== 'interactive-scripted');
    expect(baseScenarios).toEqual([
      { path: 'examples/plain/main.ts', mode: 'pipe' },
      { path: 'examples/tui/main.ts', mode: 'static-tty' },
    ]);
  });

  it('appends interactive scripted scenarios for form examples', () => {
    const scenarios = buildSmokeScenarios('/repo', ['examples/select/main.ts'], () => 'console.log("plain");');
    const interactive = scenarios.filter((scenario) => scenario.mode === 'interactive-scripted');

    expect(interactive.some((scenario) => scenario.path === 'examples/select/main.ts')).toBe(true);
  });
});
