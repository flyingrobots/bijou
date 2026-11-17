import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The script runs only in a Windows container, so these tests read its text;
// the native Windows CI lane verifies its behaviour.
const script = readFileSync(new URL('./windows-measure.ps1', import.meta.url), 'utf8');
const quotaLines = script.split('\n').filter((line) => line.includes('fsutil quota '));

describe('Windows quota initialization', () => {
  it('runs the quota commands it is expected to run', () => {
    // Witness count: enforce and modify.
    expect(quotaLines).toHaveLength(2);
  });

  it.each(quotaLines)('keeps the output of %s for its failure message', (line) => {
    // Oracle: hosted job 133839591028 failed in fsutil quota modify with its reason discarded by Out-Null.
    expect(line).not.toContain('Out-Null');
  });

  it('puts the command output into each quota failure', () => {
    const failures = script.split('\n').filter((line) => /throw '.*quota/i.test(line) || /throw ".*quota/i.test(line));
    const commandFailures = failures.filter((line) => line.includes('$LASTEXITCODE'));
    expect(commandFailures).toHaveLength(2);
    for (const line of commandFailures) expect(line).toMatch(/throw ".*\$\(\$output\)/);
  });

  it('names the quota account by the ContainerUser identifier', () => {
    // Oracle: S-1-5-93-2-2 is the well-known identifier of ContainerUser in a Windows container.
    expect(script).toContain("$containerUser = (New-Object System.Security.Principal.SecurityIdentifier 'S-1-5-93-2-2')");
    expect(script).toContain("if ($containerUser -notmatch '^[^\\\\]+\\\\ContainerUser$') { throw");
  });

  it('never passes the bare account name that fsutil could not map', () => {
    // Oracle: hosted job 133869629839, "No mapping between account names and security IDs was done."
    const bareName = script.split('\n').filter((line) => /(fsutil quota modify|FindUser).*\bContainerUser\b/.test(line));
    expect(bareName).toEqual([]);
  });

  it('still sets and verifies the 4 GiB hard limit for ContainerUser', () => {
    expect(script).toContain('fsutil quota modify C: 4227858432 4294967296 $containerUser');
    expect(script).toContain('$user = $volume.FindUser($containerUser)');
    expect(script).toContain('[long]$user.QuotaLimit -ne 4294967296');
  });
});
