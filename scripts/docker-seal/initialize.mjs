import { readFileSync, existsSync, writeFileSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
/** Reconstruct only explicitly captured Git data, never host config or pointers. */
export function initializeSnapshot(source) {
  const root = realpathSync(source);
  if (!existsSync('/.dockerenv') || readFileSync('/etc/bijou-test-seal', 'utf8') !== 'bijou-test-seal-v1\n') {
    throw new Error('Initialization requires sealed Docker image');
  }
  if (!['/work/', '/tmp/'].some((base) => root.startsWith(base))) throw new Error('Initialization requires owned temporary storage');
  if (existsSync(`${root}/.git`)) throw new Error('Copied input must not contain Git metadata');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  Object.assign(env, { HOME: '/home/test', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' });
  function git(args, input) {
    const result = spawnSync('git', args, { cwd: root, env, input, encoding: 'utf8', timeout: 60_000 });
    if (result.status !== 0) throw new Error(`Git initialization failed: ${result.stderr}`);
    return result.stdout;
  }
  const request = JSON.parse(readFileSync(`${root}/.seal/request.json`, 'utf8'));
  git(['init', '-q']);
  if (request.shallow) writeFileSync(`${root}/.git/shallow`, request.shallow);
  git(['index-pack', '--stdin'], readFileSync(`${root}/.seal/objects.pack`));
  for (const line of request.refs.split('\n').filter(Boolean)) {
    const [oid, ref] = line.split(' ');
    if (!/^refs\//.test(ref) || !/^[0-9a-f]{40,64}$/.test(oid)) throw new Error('Invalid copied ref');
    git(['update-ref', ref, oid]);
  }
  git(['update-ref', '--no-deref', 'HEAD', request.head]);
  if (request.headRef) git(['symbolic-ref', 'HEAD', request.headRef]);
  if (request.fetch.length) writeFileSync(`${root}/.git/FETCH_HEAD`, request.fetch.map((oid) => `${oid}\t\tsealed comparison base\n`).join(''));
  git(['update-index', '-z', '--index-info'], readFileSync(`${root}/.seal/index-info`));
  git(['config', 'user.name', 'Bijou sealed tests']);
  git(['config', 'user.email', 'sealed-tests@example.invalid']);
  git(['config', 'core.excludesFile', '/dev/null']);
  writeFileSync(`${root}/.git/info/exclude`, '.seal/\n');
  if (git(['remote']).trim()) throw new Error('Remotes must be absent');
  if (git(['rev-parse', '--absolute-git-dir']).trim() !== `${root}/.git`) throw new Error('Git escaped copied source');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) initializeSnapshot('/work/source');
