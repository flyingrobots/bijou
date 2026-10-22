import { dirname, join, relative, sep } from 'node:path';
import { DEPENDENCY_TYPES, INTERNAL_PACKAGE_PREFIX, isRecord, readJsonObject } from './release-metadata.part01.js';
import type { WorkspacePackage } from './release-metadata.part01.js';

function dependencyGroup(value: unknown, label: string, errors: string[]): Record<string, unknown> {
  if (value === undefined) return {};
  if (isRecord(value)) return value;
  errors.push(`${label} must be an object`);
  return {};
}

function compareDependencies(
  source: Record<string, unknown>, locked: Record<string, unknown>, label: string,
  names: ReadonlySet<string>, version: string, errors: string[],
): void {
  for (const group of DEPENDENCY_TYPES) {
    const expected = dependencyGroup(source[group], `${label} manifest ${group}`, errors);
    const actual = dependencyGroup(locked[group], `package-lock.json ${label} ${group}`, errors);
    for (const name of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
      if (!names.has(name) && !name.startsWith(INTERNAL_PACKAGE_PREFIX)) continue;
      if (!names.has(name)) {
        errors.push(`package-lock.json ${label} references unknown internal package ${name}`);
      } else if (expected[name] !== version || actual[name] !== expected[name]) {
        errors.push(`package-lock.json ${label} ${group} ${name} (${String(actual[name])}) must match manifest and release (${version})`);
      }
    }
  }
}

/** Validate npm's owned workspace metadata; third-party resolution entries stay npm's responsibility. */
export function validateWorkspaceLock(
  root: string, workspaces: readonly WorkspacePackage[], version: string,
): readonly string[] {
  const errors: string[] = [];
  try {
    const lock = readJsonObject(join(root, 'package-lock.json'));
    if ((lock['lockfileVersion'] !== 2 && lock['lockfileVersion'] !== 3) || !isRecord(lock['packages'])) {
      return ['package-lock.json requires npm lockfileVersion 2 or 3 with a packages object'];
    }
    const entries = lock['packages'];
    const names = new Set(workspaces.map(({ manifest }) => manifest.name));
    const rootEntry = entries[''];
    if (!isRecord(rootEntry)) errors.push('package-lock.json is missing the root workspace entry');
    else compareDependencies(readJsonObject(join(root, 'package.json')), rootEntry, 'root', names, version, errors);

    for (const { manifestPath } of workspaces) {
      const path = relative(root, dirname(manifestPath)).split(sep).join('/');
      const entry = entries[path];
      if (!isRecord(entry)) {
        errors.push(`package-lock.json is missing workspace ${path}`);
        continue;
      }
      if (entry['version'] !== version) {
        errors.push(`package-lock.json ${path} version (${String(entry['version'])}) does not match expected (${version})`);
      }
      compareDependencies(readJsonObject(manifestPath), entry, path, names, version, errors);
    }
  } catch (error) {
    errors.push(`package-lock.json validation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  return errors;
}
