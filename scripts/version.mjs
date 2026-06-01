#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

function usage() {
  console.error('Usage: npm run version <version>');
  console.error('Example: npm run version 0.2.0');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function workspaceManifestPaths(root) {
  const rootManifest = readJson(join(root, 'package.json'));
  const workspaces = Array.isArray(rootManifest.workspaces)
    ? rootManifest.workspaces
    : rootManifest.workspaces?.packages;

  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    throw new Error('Root package.json is missing workspaces configuration');
  }

  const manifestPaths = new Set();

  for (const pattern of workspaces) {
    if (pattern.endsWith('/*')) {
      const basePattern = pattern.slice(0, -2);
      if (basePattern.includes('*')) {
        throw new Error(`Unsupported workspace pattern: ${pattern}`);
      }

      const baseDir = join(root, basePattern);
      if (!existsSync(baseDir)) {
        throw new Error(`Workspace directory does not exist: ${pattern}`);
      }

      for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const manifestPath = join(baseDir, entry.name, 'package.json');
        if (!existsSync(manifestPath)) {
          throw new Error(`Workspace package is missing package.json: ${join(basePattern, entry.name)}`);
        }
        manifestPaths.add(manifestPath);
      }
      continue;
    }

    if (pattern.includes('*')) {
      throw new Error(`Unsupported workspace pattern: ${pattern}`);
    }

    const manifestPath = join(root, pattern, 'package.json');
    if (!existsSync(manifestPath)) {
      throw new Error(`Workspace package is missing package.json: ${pattern}`);
    }
    manifestPaths.add(manifestPath);
  }

  return [...manifestPaths].sort();
}

if (process.argv.length !== 3) {
  usage();
  process.exit(1);
}

const version = process.argv[2];
if (!/^[0-9]+\.[0-9]+\.[0-9]+(-(rc|beta|alpha)\.[0-9]+)?$/.test(version)) {
  console.error(`Error: invalid semver: ${version}`);
  console.error('Expected: X.Y.Z or X.Y.Z-(rc|beta|alpha).N');
  process.exit(1);
}

const root = process.cwd();
const packages = workspaceManifestPaths(root);

console.log(`Bumping all packages to ${version}`);
console.log('');

for (const manifestPath of packages) {
  const manifest = readJson(manifestPath);
  manifest.version = version;
  writeJson(manifestPath, manifest);
  console.log(`  ${manifest.name} -> ${version}`);
}

console.log('');
console.log('Pinning cross-dependencies...');

for (const manifestPath of packages) {
  const manifest = readJson(manifestPath);
  let changed = false;

  for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
    if (manifest[depType] == null) continue;
    for (const name of Object.keys(manifest[depType])) {
      if (!name.startsWith('@flyingrobots/bijou')) continue;
      manifest[depType][name] = version;
      changed = true;
    }
  }

  if (changed) {
    writeJson(manifestPath, manifest);
    console.log(`  ${manifest.name}: pinned internal deps -> ${version}`);
  }
}

console.log('');
console.log('Done. Recommended next steps:');
console.log('  git add -A');
console.log(`  git commit -m 'chore(release): v${version}'`);
console.log(`  git tag -a v${version} -m 'release: v${version}'`);
console.log('  git push origin <branch>');
console.log(`  git push origin v${version}`);
