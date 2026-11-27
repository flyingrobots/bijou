import { posix, win32 } from 'node:path';
import { describe, expect, it } from 'vitest';
import { localPathViolations } from './no-local-path-policy.js';

// Fictional paths are constructed as test data; production literals stay visible
// to the repository scanner. No source file receives a blanket exemption.
const home = posix.join('/', 'home', 'test');
const alice = posix.join('/', 'home', 'alice', 'secret');
const macAlice = posix.join('/', 'Users', 'alice', 'secret');
const lock = posix.join('/', 'Users', 'Shared', 'git-locks', 'workstation.git');
const worker = 'scripts/docker-seal/worker.mjs';

describe('fixed container paths versus machine-local paths', () => {
  it('admits the canonical disposable Linux home and its cache', () => {
    expect(localPathViolations(worker, `${home} ${home}/.npm`)).toEqual([]);
  });

  it.each(['work', 'temp', 'home', 'node', 'Git', 'Windows', 'bijou-test-seal'])('rejects a Windows %s root, now that no sealed Windows worker exists', (root) => {
    const path = win32.join('C:', '/', root, 'child');
    expect(localPathViolations(worker, path)).toEqual([path]);
  });

  it.each([`${home}er`, `${home}\\er`, `${home}/../alice`, alice, macAlice, win32.join('D:', '/', 'private'), win32.join('C:', '/', 'workstation')])('rejects a noncanonical or escaping path: %s', (path) => {
    expect(localPathViolations(worker, path)).toEqual([path]);
  });

  it('still rejects personal paths beside valid roots in the same string', () => {
    expect(localPathViolations(worker, `${home} ${alice} ${macAlice}`)).toEqual([alice, macAlice]);
  });

  it.each(['src/app.ts', 'scripts/docker-seal-other/run.mjs', 'scripts/docker-seal/../app.ts'])('does not allow container paths outside their scope: %s', (path) => {
    expect(localPathViolations(path, home)).toEqual([home]);
  });

  it.each(['run.mjs', 'bootstrap.mjs', 'worker.mjs'])('rejects a hard-coded shared lock store in %s', (file) => {
    expect(localPathViolations(`scripts/docker-seal/${file}`, lock)).toEqual([lock]);
  });

  it('rejects file URLs even in Docker tooling', () => {
    const url = ['file:', '//domain.json'].join('');
    expect(localPathViolations(worker, url)).toEqual(['file URL']);
  });
});
