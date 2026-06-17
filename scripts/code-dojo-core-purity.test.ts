import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('Code Dojo core purity gate', () => {
  it('includes package core and domain production files', () => {
    expect(evaluateCorePurityExpression("isCoreFile('packages/bijou/src/core/theme/color.ts')")).toBe('true');
    expect(evaluateCorePurityExpression("isCoreFile('packages/bijou/src/domain/model.ts')")).toBe('true');
    expect(evaluateCorePurityExpression("isCoreFile('src/core/model.ts')")).toBe('true');
    expect(evaluateCorePurityExpression("isCoreFile('src/domain/model.ts')")).toBe('true');
  });

  it('excludes adapters, declarations, and test-only files', () => {
    expect(evaluateCorePurityExpression("isCoreFile('packages/bijou/src/adapters/test/clock.ts')")).toBe('false');
    expect(evaluateCorePurityExpression("isCoreFile('packages/bijou/src/core/theme/color.test.ts')")).toBe('false');
    expect(evaluateCorePurityExpression("isCoreFile('packages/bijou/src/core/theme/color.d.ts')")).toBe('false');
    expect(evaluateCorePurityExpression("isCoreFile('packages/bijou/src/core/theme/test-support.ts')")).toBe('false');
  });

  it('reports host effects in package core files', () => {
    const output = runCorePurityScript(`
      const failures = findCorePurityFailures(
        ['packages/bijou/src/core/model.ts'],
        () => 'export const value = Date.now();\\n',
      );
      process.stdout.write(failures.join('\\n'));
    `);

    expect(output).toBe(
      'packages/bijou/src/core/model.ts:1 — time must be injected through ClockPort: export const value = Date.now();',
    );
  });
});

function evaluateCorePurityExpression(expression: string): string {
  return runCorePurityScript(`process.stdout.write(String(${expression}));`);
}

function runCorePurityScript(body: string): string {
  return execFileSync(process.execPath, [
    '--input-type=module',
    '--eval',
    `import { findCorePurityFailures, isCoreFile } from './scripts/code-dojo/check-core-purity.mjs';\n${body}`,
  ], { encoding: 'utf8' });
}
