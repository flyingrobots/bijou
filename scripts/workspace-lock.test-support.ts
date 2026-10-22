import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { isRecord, readJsonObject } from './release-metadata.part01.js';

export const REPO = resolve(import.meta.dirname, '..');
const roots: string[] = [];

export function writeJson(root: string, path: string, value: unknown): void {
  writeFileSync(join(root, path), `${JSON.stringify(value, null, 2)}\n`);
}

export function makeLockedWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'bijou-version-lock-'));
  roots.push(root);
  const manifests = {
    'packages/core': { name: '@flyingrobots/bijou', version: '1.0.0' },
    'packages/node': {
      name: '@flyingrobots/bijou-node', version: '1.0.0',
      dependencies: { '@flyingrobots/bijou': '1.0.0' },
    },
    'packages/tui': {
      name: '@flyingrobots/bijou-tui', version: '1.0.0',
      peerDependencies: { '@flyingrobots/bijou': '1.0.0' },
    },
    bench: {
      name: '@flyingrobots/bijou-bench', version: '1.0.0',
      devDependencies: { '@flyingrobots/bijou-node': '1.0.0' },
      optionalDependencies: { '@flyingrobots/bijou': '1.0.0' },
    },
  };
  const rootManifest = { name: 'version-fixture', private: true, workspaces: ['packages/*', 'bench'] };
  writeJson(root, 'package.json', rootManifest);
  for (const [path, manifest] of Object.entries(manifests)) {
    mkdirSync(join(root, path), { recursive: true });
    writeJson(root, `${path}/package.json`, manifest);
  }
  writeJson(root, 'package-lock.json', { name: rootManifest.name, lockfileVersion: 3, packages: { '': rootManifest, ...manifests } });
  return root;
}

export function cleanupWorkspaces(): void {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
}

export function runVersion(root: string, version: string) {
  return spawnSync(process.execPath, [join(REPO, 'scripts/version.mjs'), version], {
    cwd: root, encoding: 'utf8', timeout: 30_000,
    env: { ...process.env, npm_config_offline: 'true', npm_config_ignore_scripts: 'false' },
  });
}

export function patchLockedPackage(root: string, key: string, patch: Record<string, unknown>): void {
  const lock = readJsonObject(join(root, 'package-lock.json'));
  const packages = lock['packages'];
  if (!isRecord(packages) || !isRecord(packages[key])) throw new Error(`Missing fixture package ${key}`);
  Object.assign(packages[key], patch);
  writeJson(root, 'package-lock.json', lock);
}

export function prepareHook(root: string): string {
  mkdirSync(join(root, 'scripts'));
  for (const name of ['release-metadata', 'release-metadata.part01', 'release-metadata.part02',
    'release-metadata.part03', 'release-metadata.part04', 'release-lockfile', 'check-staged-workspace']) {
    const source = join(REPO, 'scripts', `${name}.ts`);
    if (existsSync(source)) copyFileSync(source, join(root, 'scripts', `${name}.ts`));
  }
  symlinkSync(join(REPO, 'node_modules'), join(root, 'node_modules'), 'junction');
  fixtureGit(root, ['init', '--quiet']);
  fixtureGit(root, ['add', '--', 'package.json', 'package-lock.json', 'packages', 'bench']);
  return join(REPO, 'scripts/hooks/pre-commit');
}

export function fixtureGit(root: string, args: readonly string[]): string {
  const env = { ...process.env };
  delete env['GIT_DIR'];
  delete env['GIT_WORK_TREE'];
  delete env['GIT_COMMON_DIR'];
  delete env['GIT_INDEX_FILE'];
  const result = spawnSync('git', ['-C', root, ...args], { env, encoding: 'utf8', timeout: 10_000 });
  if (result.status !== 0) throw new Error(result.stderr || 'Fixture Git command failed');
  return result.stdout;
}
