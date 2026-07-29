import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { TAG_PATTERN, VERSION_PATTERN, isRecord, isString, readJsonObject, readPackageManifest } from './release-metadata.part01.js';
import type { ReleaseMetadata, WorkspacePackage } from './release-metadata.part01.js';

export function readWorkspacePackages(root: string): readonly WorkspacePackage[] {
  const rootManifest = readJsonObject(join(root, 'package.json'));
  const workspaces = rootManifest['workspaces'];
  let workspacePatterns: readonly string[] | undefined;

  if (Array.isArray(workspaces) && workspaces.every(isString)) {
    workspacePatterns = workspaces;
  } else if (isRecord(workspaces)) {
    const packages = workspaces['packages'];
    if (Array.isArray(packages) && packages.every(isString)) {
      workspacePatterns = packages;
    }
  }

  if (!workspacePatterns || workspacePatterns.length === 0) {
    throw new Error('Root package.json is missing workspaces configuration');
  }

  const manifestPaths = new Set<string>();

  for (const pattern of workspacePatterns) {
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
          throw new Error(`Workspace package is missing package.json: ${join(pattern.slice(0, -1), entry.name)}`);
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

  if (manifestPaths.size === 0) {
    throw new Error('Workspace configuration did not resolve any package.json files');
  }

  return [...manifestPaths]
    .map((manifestPath) => ({
      manifestPath,
      manifest: readPackageManifest(manifestPath),
    }))
    .sort((left, right) => left.manifest.name.localeCompare(right.manifest.name));
}

export function validateReleaseVersion(version: string): string {
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`Invalid release version: ${version}`);
  }

  return version;
}

export function readCurrentWorkspaceVersion(root: string): string {
  const packages = readWorkspacePackages(root);
  const firstPackage = packages[0];
  if (firstPackage == null) {
    throw new Error('Workspace configuration did not resolve any package.json files');
  }

  return validateReleaseVersion(firstPackage.manifest.version);
}

export function parseReleaseTag(tag: string): ReleaseMetadata {
  const match = TAG_PATTERN.exec(tag);
  if (!match?.groups) {
    throw new Error(`Invalid tag format: ${tag}`);
  }

  const version = match.groups['version'];
  const channel = match.groups['channel'];
  const serial = match.groups['serial'];
  if (version === undefined) throw new Error(`Invalid tag format: ${tag}`);
  if (channel !== undefined && (channel !== 'rc' && channel !== 'beta' && channel !== 'alpha')) {
    throw new Error(`Invalid prerelease channel in tag: ${tag}`);
  }
  if (channel !== undefined && serial === undefined) {
    throw new Error(`Invalid prerelease serial in tag: ${tag}`);
  }
  const tagVersion = channel === undefined ? version : `${version}-${channel}.${String(serial)}`;

  if (!channel) {
    return {
      tag,
      tagVersion,
      isPrerelease: false,
      npmDistTag: 'latest',
    };
  }

  return {
    tag,
    tagVersion,
    isPrerelease: true,
    npmDistTag: channel === 'rc' ? 'next' : channel === 'beta' ? 'beta' : 'alpha',
  };
}
