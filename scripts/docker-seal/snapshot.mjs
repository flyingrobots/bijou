import { mkdtempSync, mkdirSync, lstatSync, writeFileSync, chmodSync, rmSync, existsSync, readFileSync, openSync, closeSync, fstatSync, constants, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, relative, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { execute, requireFree } from './process.mjs';
import { LIMITS, cleanEnvironment } from './constants.mjs';
const FORBIDDEN = new Set(['.git', '.claude', 'node_modules', 'dist', '.docker-seal-evidence']);
function admitted(path) {
  const parts = path.split('/');
  return !parts.some((part) => FORBIDDEN.has(part) || part === '..')
    && !path.startsWith('/') && !(basename(path).startsWith('.env') && path !== '.env.example')
    && !['.npmrc', '.netrc', 'id_rsa', 'id_ed25519'].includes(basename(path));
}
/** Preserve file bytes, all reachable refs, staged blobs and index stages, never host Git configuration. */
export async function snapshot(root, command, stdin, options = {}) {
  root = realpathSync(root);
  requireFree(root); requireFree(tmpdir());
  return captureSnapshot(root, command, stdin, { ...options, measurementPath: root });
}
/** Capture under an already established resource boundary; callers own admission. */
export async function captureSnapshot(root, command, stdin, options) {
  root = realpathSync(root);
  const { generatedBudget = 40 * 1024 ** 2, signal, measurementPath, fullPush = false } = options;
  if (typeof fullPush !== 'boolean') throw new Error('Full-push capture control must be boolean');
  const gitEnv = cleanEnvironment();
  const run = (argv, configuration = {}) => execute(argv, { ...configuration, signal, hostPath: measurementPath });
  const git = async (root, ...args) => (await run(['git', '-C', root, ...args], { binary: true, maxBytes: LIMITS.pack, env: gitEnv })).output;
  const directory = mkdtempSync(join(tmpdir(), 'bijou-sealed-'));
  try {
  if (options.sourceIndex !== undefined) {
    const administration = realpathSync((await git(root, 'rev-parse', '--absolute-git-dir')).toString().trim());
    gitEnv.GIT_INDEX_FILE = freezeIndex(options.sourceIndex, administration, directory);
  }
  const source = join(directory, 'source'); mkdirSync(source);
  const paths = (await git(root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'))
    .toString().split('\0').filter(Boolean);
  let copied = 0;
  for (const path of new Set(paths)) {
    if (path === '.seal' || path.startsWith('.seal/')) throw new Error('Reserved snapshot metadata path exists');
    if (!admitted(path)) continue;
    const from = resolve(root, path);
    if (relative(root, from).startsWith('..')) throw new Error('Snapshot path escapes source');
    let stat;
    try { stat = lstatSync(from); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    // No source symlink may smuggle credentials or host paths into the archive.
    if (!stat.isFile()) throw new Error(`Unsupported source entry: ${path}`);
    let parent = dirname(from);
    while (parent !== root) {
      if (parent === dirname(parent)) throw new Error('Source ancestry escaped repository');
      if (lstatSync(parent).isSymbolicLink()) throw new Error(`Symlink ancestor: ${path}`);
      parent = dirname(parent);
    }
    copied += stat.size;
    if (copied > LIMITS.source) throw new Error('Source snapshot exceeds 256 MiB');
    const to = join(source, path); mkdirSync(dirname(to), { recursive: true });
    const fd = openSync(from, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const opened = fstatSync(fd);
      if (opened.ino !== stat.ino || opened.dev !== stat.dev || opened.size !== stat.size
          || !opened.isFile() || realpathSync(from) !== from) throw new Error('Source changed during capture');
      const content = readFileSync(fd);
      const after = fstatSync(fd);
      if (after.size !== opened.size || after.mtimeMs !== opened.mtimeMs || content.length !== opened.size) throw new Error('Source changed while reading');
      writeFileSync(to, content); chmodSync(to, stat.mode & 0o777);
    } finally { closeSync(fd); }
  }
  const metadata = join(source, '.seal'); mkdirSync(metadata);
  const refs = (await git(root, 'for-each-ref', '--format=%(objectname) %(refname)',
    'refs/heads', 'refs/remotes', 'refs/tags')).toString();
  const head = (await git(root, 'rev-parse', 'HEAD')).toString().trim();
  const symbolic = await run(['git', '-C', root, 'symbolic-ref', '-q', 'HEAD'], { allowFailure: true });
  if (![0, 1].includes(symbolic.code)) throw new Error('Cannot establish symbolic HEAD');
  const headRef = symbolic.code === 0 ? symbolic.output.toString().trim() : null;
  const shallowPath = (await git(root, 'rev-parse', '--git-path', 'shallow')).toString().trim();
  const shallow = existsSync(resolve(root, shallowPath)) ? readFileSync(resolve(root, shallowPath), 'utf8') : '';
  if (shallow.split('\n').filter(Boolean).some((oid) => !/^[0-9a-f]{40,64}$/.test(oid))) throw new Error('Invalid shallow boundary');
  const fetchPath = (await git(root, 'rev-parse', '--git-path', 'FETCH_HEAD')).toString().trim();
  const fetch = existsSync(resolve(root, fetchPath)) ? readFileSync(resolve(root, fetchPath), 'utf8')
    .split('\n').filter(Boolean).map((line) => line.split('\t')[0]) : [];
  if (fetch.some((oid) => !/^[0-9a-f]{40,64}$/.test(oid))) throw new Error('Invalid FETCH_HEAD');
  const index = await git(root, 'ls-files', '--stage', '-z');
  const objects = new Set([head, ...fetch, ...refs.split('\n').filter(Boolean).map((line) => line.split(' ')[0]),
    ...index.toString().split('\0').filter(Boolean).map((line) => line.split(' ')[1])]);
  const pack = (await run(['git', '-C', root, 'pack-objects', '--stdout', '--revs'], {
    binary: true, input: [...objects].join('\n') + '\n', maxBytes: LIMITS.pack, signal,
  })).output;
  writeFileSync(join(metadata, 'objects.pack'), pack);
  writeFileSync(join(metadata, 'index-info'), index);
  writeFileSync(join(metadata, 'stdin'), stdin);
  writeFileSync(join(metadata, 'request.json'), JSON.stringify({ head, headRef, refs, fetch, shallow, command, generatedBudget, fullPush }));
  const archive = (await run(['tar', '-cf', '-', '-C', directory, 'source'], {
    binary: true, maxBytes: LIMITS.archive, signal,
  })).output;
  return { directory, archive, source, sourceBytes: copied,
    digest: createHash('sha256').update(archive).digest('hex') };
  } catch (error) { rmSync(directory, { recursive: true, force: true }); throw error; }
}

/** Freeze only a regular index owned by this worktree's Git administration. */
function freezeIndex(input, administration, directory) {
  const path = resolve(input);
  const stat = lstatSync(path);
  if (!stat.isFile() || dirname(realpathSync(path)) !== administration || stat.size > 16 * 1024 ** 2) {
    throw new Error('Source index must be a regular file under this worktree Git directory, at most 16 MiB');
  }
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd);
    if (!opened.isFile() || opened.ino !== stat.ino || opened.dev !== stat.dev || opened.size !== stat.size) throw new Error('Source index changed before capture');
    const content = readFileSync(fd);
    const after = fstatSync(fd);
    if (after.size !== opened.size || after.mtimeMs !== opened.mtimeMs || content.length !== opened.size) throw new Error('Source index changed during capture');
    const copy = join(directory, 'capture-index');
    writeFileSync(copy, content, { flag: 'wx', mode: 0o400 });
    return copy;
  } finally { closeSync(fd); }
}
