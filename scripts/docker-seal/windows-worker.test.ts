import { describe, expect, it } from 'vitest';
import { prepareWorkerProgram } from './windows-worker.mjs';

// The program runs only in a Windows container, so these tests read its text;
// the native Windows CI lane verifies its behaviour.
describe('Windows worker preparation', () => {
  it('accepts a directory that already exists in a started container', () => {
    // Oracle: New-Item without -Force fails with DirectoryExist (hosted job 133834195815, C:\temp).
    expect(prepareWorkerProgram).toMatch(/New-Item -ItemType Directory -Force /);
  });

  it.each(['C:\\work\\source', 'C:\\temp', 'C:\\home'])('creates %s', (directory) => {
    const creation = prepareWorkerProgram.slice(0, prepareWorkerProgram.indexOf('| Out-Null'));
    expect(creation.split(/[ ,]/)).toContain(directory);
  });

  it('stops on the first failed step', () => {
    expect(prepareWorkerProgram.startsWith("$ErrorActionPreference='Stop';")).toBe(true);
    expect(prepareWorkerProgram).toContain("if($LASTEXITCODE -ne 0) { throw 'Permission setup failed' }");
  });
});
