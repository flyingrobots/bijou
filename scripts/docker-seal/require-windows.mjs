import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { win32 } from 'node:path';
import { ensureDocker } from '@git-stunts/docker-guard';
import { requireSealMarker } from './windows-seal.mjs';

/** Windows admission complements the host's inspected Docker isolation profile. */
export function requireWindows() {
  const refuse = (reason) => { throw new Error(`Windows Docker test seal refused: ${reason}`); };
  if (process.platform !== 'win32') refuse('Windows container required');
  // GitHub's runner detects Windows containers through the running CExecSvc service:
  // actions/runner, src/Runner.Worker/ContainerOperationProvider.cs, AssertCompatibleOS.
  const service = execFileSync('sc.exe', ['query', 'cexecsvc'], {
    encoding: 'utf8', timeout: 5000, maxBuffer: 16384,
  });
  if (!/STATE\s*:\s*4\s+RUNNING/u.test(service)) refuse('container execution service is not running');
  requireSealMarker(readFileSync('C:\\bijou-test-seal', 'utf8'), 'Windows Docker test seal');
  if (readdirSync('\\\\.\\pipe\\').some((name) => /docker|containerd/iu.test(name))) refuse('container control pipe exposed');
  if (Object.values(networkInterfaces()).flat().some((entry) => entry && !entry.internal)) refuse('network beyond loopback');
  const allowedGit = new Set(['GIT_CONFIG_GLOBAL', 'GIT_CONFIG_NOSYSTEM', 'GIT_STUNTS_DOCKER']);
  if (Object.keys(process.env).map((key) => key.toUpperCase()).some((key) => key.startsWith('GIT_') && !allowedGit.has(key))) refuse('inherited Git locator');
  for (const name of ['GH_TOKEN', 'GITHUB_TOKEN', 'NODE_AUTH_TOKEN', 'NPM_TOKEN', 'AWS_SECRET_ACCESS_KEY']) {
    if (process.env[name]) refuse('credential environment present');
  }
  const source = realpathSync('C:\\work\\source');
  if (source.toLowerCase() !== 'c:\\work\\source') refuse('source is redirected');
  const cwd = realpathSync(process.cwd()).toLowerCase();
  if (!['c:\\work', 'c:\\temp', 'c:\\home'].some((root) => cwd === root || cwd.startsWith(`${root}\\`))) refuse('working directory outside disposable data');
  const gitDir = win32.join(source, '.git');
  if (!lstatSync(gitDir).isDirectory() || realpathSync(gitDir).toLowerCase() !== gitDir.toLowerCase()) refuse('Git is not independent');
  for (const path of ['commondir', 'objects/info/alternates']) {
    if (existsSync(win32.join(gitDir, path))) refuse('external Git storage');
  }
  const git = (args) => execFileSync('git.exe', ['-C', source, ...args], {
    encoding: 'utf8', timeout: 5000, maxBuffer: 128 * 1024,
  }).trim();
  if (git(['remote'])) refuse('source has remotes');
  if (realpathSync(git(['rev-parse', '--absolute-git-dir'])).toLowerCase() !== gitDir.toLowerCase()) refuse('Git directory escaped source');
  if (realpathSync(git(['rev-parse', '--show-toplevel'])).toLowerCase() !== source.toLowerCase()) refuse('Git worktree escaped source');
  ensureDocker({ env: { GIT_STUNTS_DOCKER: '1' } });
}
