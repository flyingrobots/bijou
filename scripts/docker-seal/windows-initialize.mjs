import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root = 'C:\\work\\source';
if (process.platform !== 'win32' || readFileSync('C:\\bijou-test-seal', 'utf8') !== 'bijou-test-seal-v1\n') {
  throw new Error('Windows initialization requires the sealed image');
}
if (existsSync(`${root}\\.git`)) throw new Error('Copied input contains Git metadata');
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith('GIT_')));
Object.assign(env, { HOME: 'C:\\home', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: 'NUL' });
function git(args, input) {
  const result = spawnSync('git.exe', args, { cwd: root, env, input, encoding: 'utf8', timeout: 60000 });
  if (result.status !== 0) throw new Error(`Git initialization failed: ${result.stderr}`);
  return result.stdout;
}
const request = JSON.parse(readFileSync(`${root}\\.seal\\request.json`, 'utf8'));
git(['init', '-q']);
if (request.shallow) writeFileSync(`${root}\\.git\\shallow`, request.shallow);
git(['index-pack', '--stdin'], readFileSync(`${root}\\.seal\\objects.pack`));
for (const line of request.refs.split('\n').filter(Boolean)) {
  const [oid, ref] = line.split(' ');
  if (!/^refs\//u.test(ref) || !/^[0-9a-f]{40,64}$/u.test(oid)) throw new Error('Invalid copied ref');
  git(['update-ref', ref, oid]);
}
git(['update-ref', '--no-deref', 'HEAD', request.head]);
if (request.headRef) {
  if (typeof request.headRef !== 'string' || !request.headRef.startsWith('refs/heads/')) throw new Error('Invalid copied HEAD branch');
  git(['check-ref-format', request.headRef]);
  if (git(['rev-parse', '--verify', request.headRef]).trim() !== request.head) throw new Error('Copied branch does not match HEAD');
  git(['symbolic-ref', 'HEAD', request.headRef]);
}
git(['update-index', '-z', '--index-info'], readFileSync(`${root}\\.seal\\index-info`));
git(['config', 'user.name', 'Bijou sealed tests']);
git(['config', 'user.email', 'sealed-tests@example.invalid']);
git(['config', 'core.excludesFile', 'NUL']);
writeFileSync(`${root}\\.git\\info\\exclude`, '.seal/\n');
if (request.fetch?.length) writeFileSync(`${root}\\.git\\FETCH_HEAD`, request.fetch.map((oid) => `${oid}\t\tcopied base\n`).join(''));
if (git(['remote']).trim()) throw new Error('Remotes must be absent');
