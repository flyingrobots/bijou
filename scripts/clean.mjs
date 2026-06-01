#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function workspacePackageDirs(root) {
  const rootManifest = readJson(join(root, 'package.json'));
  const workspaces = Array.isArray(rootManifest.workspaces)
    ? rootManifest.workspaces
    : rootManifest.workspaces?.packages;

  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    throw new Error('Root package.json is missing workspaces configuration');
  }

  const dirs = new Set();

  for (const pattern of workspaces) {
    if (pattern.endsWith('/*')) {
      const basePattern = pattern.slice(0, -2);
      if (basePattern.includes('*')) {
        throw new Error(`Unsupported workspace pattern: ${pattern}`);
      }

      const baseDir = join(root, basePattern);
      for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const dir = join(baseDir, entry.name);
        if (existsSync(join(dir, 'package.json'))) {
          dirs.add(dir);
        }
      }
      continue;
    }

    if (pattern.includes('*')) {
      throw new Error(`Unsupported workspace pattern: ${pattern}`);
    }

    const dir = join(root, pattern);
    if (existsSync(join(dir, 'package.json'))) {
      dirs.add(dir);
    }
  }

  return [...dirs].sort();
}

function removeIfExists(path) {
  rmSync(path, { force: true, recursive: true });
}

const root = process.cwd();
let removed = 0;

for (const dir of workspacePackageDirs(root)) {
  const dist = join(dir, 'dist');
  if (existsSync(dist)) {
    removeIfExists(dist);
    removed++;
  }

  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.tsbuildinfo')) continue;
    removeIfExists(join(dir, entry));
    removed++;
  }
}

console.log(`Removed ${removed} build artifact${removed === 1 ? '' : 's'}.`);
