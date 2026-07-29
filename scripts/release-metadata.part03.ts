import { appendFileSync } from 'node:fs';
import { DEPENDENCY_TYPES, INTERNAL_PACKAGE_PREFIX } from './release-metadata.part01.js';
import type { ReleaseCommandOutputs, WorkspacePackage } from './release-metadata.part01.js';
import { readWorkspacePackages } from './release-metadata.part02.js';

export function validateWorkspaceVersion(
  root: string,
  expectedVersion: string,
): { readonly packages: readonly WorkspacePackage[]; readonly errors: readonly string[] } {
  const packages = readWorkspacePackages(root);
  const internalPackageNames = new Set(packages.map((entry) => entry.manifest.name));
  const errors: string[] = [];

  for (const entry of packages) {
    const { name, version } = entry.manifest;
    if (version !== expectedVersion) {
      errors.push(`${name} version (${version}) does not match expected (${expectedVersion})`);
    }
  }

  for (const entry of packages) {
    for (const dependencyType of DEPENDENCY_TYPES) {
      const deps = entry.manifest[dependencyType];
      if (!deps) continue;
      for (const [name, version] of Object.entries(deps)) {
        const isKnownWorkspacePackage = internalPackageNames.has(name);
        const isBijouScopedDependency = name.startsWith(INTERNAL_PACKAGE_PREFIX);

        if (!isKnownWorkspacePackage && !isBijouScopedDependency) continue;
        if (isBijouScopedDependency && !isKnownWorkspacePackage) {
          errors.push(`${entry.manifest.name} references unknown internal package ${name} in ${dependencyType}`);
          continue;
        }
        if (version !== expectedVersion) {
          errors.push(`${entry.manifest.name} has ${name}@${version} in ${dependencyType}, expected ${expectedVersion}`);
        }
      }
    }
  }

  return { packages, errors };
}

export function writeGithubOutput(filepath: string, outputs: ReleaseCommandOutputs): void {
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
  appendFileSync(filepath, `${lines.join('\n')}\n`, 'utf8');
}

export function formatReleaseOutputs(outputs: ReleaseCommandOutputs): string {
  return `${Object.entries(outputs)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')}\n`;
}

function printPackageSummary(
  packages: readonly WorkspacePackage[],
  expectedVersion: string,
  label: string,
  write: (text: string) => void,
): void {
  for (const entry of packages) {
    write(`${entry.manifest.name}: ${entry.manifest.version} (${label}: ${expectedVersion})\n`);
  }
}

function parseOption(argv: readonly string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) return undefined;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function hasFlag(argv: readonly string[], flag: string): boolean {
  return argv.includes(flag);
}

export { hasFlag, parseOption, printPackageSummary };
