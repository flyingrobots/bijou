import { describe, expect, it } from 'vitest';
import { assignSourceOwnerProgram, prepareWorkerProgram } from './windows-worker.mjs';

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

describe('Windows source ownership', () => {
  it('names the owner by the ContainerUser identifier', () => {
    // Oracle: S-1-5-93-2-2 is the identifier the worker reported for User Manager\ContainerUser (hosted job 133911265792).
    expect(assignSourceOwnerProgram).toContain("icacls C:\\work\\source /setowner '*S-1-5-93-2-2'");
  });

  it('never uses the bare account name that the worker cannot map', () => {
    // Oracle: hosted job 135338919290, "No mapping between account names and security IDs was done."
    expect(assignSourceOwnerProgram).not.toContain('ContainerUser');
  });

  it('still verifies that the identifier owns the source root', () => {
    expect(assignSourceOwnerProgram).toContain('$actual=(Get-Acl C:\\work\\source).GetOwner([System.Security.Principal.SecurityIdentifier]).Value');
    expect(assignSourceOwnerProgram).toContain("if($actual -ne 'S-1-5-93-2-2') { throw 'Source ownership verification failed' }");
  });

  it('stops when the assignment fails', () => {
    expect(assignSourceOwnerProgram.startsWith("$ErrorActionPreference='Stop';")).toBe(true);
    expect(assignSourceOwnerProgram).toContain("if($LASTEXITCODE -ne 0) { throw 'Source ownership assignment failed' }");
  });
});
