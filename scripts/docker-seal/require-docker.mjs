import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureDocker } from '@git-stunts/docker-guard';
import { readNetworkEntries } from './network-entries.mjs';
import { verifyKernelSeal } from './seal-policy.mjs';

/** Admit test execution only after independent kernel and repository checks. */
export function requireDocker() {
  const refuse = (reason) => { throw new Error(`Docker test seal refused: ${reason}. Use the sealed Docker runner.`); };
  if (process.platform !== 'linux' || !existsSync('/.dockerenv')) refuse('host execution');
  const locators = [
    'GIT_DIR', 'GIT_COMMON_DIR', 'GIT_WORK_TREE', 'GIT_IMPLICIT_WORK_TREE', 'GIT_INDEX_FILE',
    'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_GRAFT_FILE', 'GIT_SHALLOW_FILE',
    'GIT_CONFIG', 'GIT_CONFIG_PARAMETERS', 'GIT_CONFIG_COUNT', 'GIT_PREFIX', 'GIT_REPLACE_REF_BASE',
  ];
  if (locators.some((name) => process.env[name] !== undefined)) refuse('inherited Git locator');
  verifyKernelSeal({
    dockerFile: true,
    marker: readFileSync('/etc/bijou-test-seal', 'utf8'),
    interfaces: readNetworkEntries(),
    sockets: ['/var/run/docker.sock', '/run/docker.sock'].filter((path) => existsSync(path)),
    mountInfo: readFileSync('/proc/self/mountinfo', 'utf8'),
  });
  const source = realpathSync('/work/source');
  if (source !== '/work/source') refuse('source root is redirected');
  const cwd = realpathSync(process.cwd());
  if (!['/work', '/tmp', '/home/test'].some((root) => cwd === root || cwd.startsWith(`${root}/`))) refuse('working directory outside temporary filesystems');
  const gitDir = resolve(source, '.git');
  if (!lstatSync(gitDir).isDirectory() || realpathSync(gitDir) !== gitDir) refuse('source .git is not self-contained');
  for (const path of ['commondir', 'objects/info/alternates']) {
    if (existsSync(resolve(gitDir, path))) refuse('external Git storage');
  }
  const git = (args) => execFileSync('git', ['-C', source, ...args], {
    encoding: 'utf8', timeout: 5_000, maxBuffer: 128 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  if (git(['remote']) !== '') refuse('source repository has remotes');
  if (realpathSync(git(['rev-parse', '--absolute-git-dir'])) !== gitDir) refuse('Git directory escapes source');
  if (realpathSync(git(['rev-parse', '--show-toplevel'])) !== source) refuse('Git worktree escapes source');
  // Never forward GITHUB_ACTIONS or an environment-only bypass to the package.
  ensureDocker({ env: { GIT_STUNTS_DOCKER: '1' } });
}

requireDocker();
