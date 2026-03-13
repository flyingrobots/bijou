import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type DependencyMap = Record<string, string>;
type DependencyType = 'dependencies' | 'devDependencies' | 'peerDependencies';
const INTERNAL_PACKAGE_PREFIX = '@flyingrobots/bijou';

export interface PackageManifest {
  readonly name: string;
  readonly version: string;
  readonly dependencies?: DependencyMap;
  readonly devDependencies?: DependencyMap;
  readonly peerDependencies?: DependencyMap;
}

export interface WorkspacePackage {
  readonly manifestPath: string;
  readonly manifest: PackageManifest;
}

export interface StableReleaseMetadata {
  readonly tag: string;
  readonly tagVersion: string;
  readonly isPrerelease: false;
  readonly npmDistTag: 'latest';
}

export interface PrereleaseMetadata {
  readonly tag: string;
  readonly tagVersion: string;
  readonly isPrerelease: true;
  readonly npmDistTag: 'next' | 'beta' | 'alpha';
}

export type ReleaseMetadata = StableReleaseMetadata | PrereleaseMetadata;

export interface ReleaseCommandIO {
  readonly cwd?: string;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}

export interface ReleaseCommandOutputs {
  readonly [key: string]: string;
}

interface RootWorkspaceManifest {
  readonly workspaces?: readonly string[] | { readonly packages?: readonly string[] };
}

const VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+(-(rc|beta|alpha)\.[0-9]+)?$/;
const TAG_PATTERN = /^v(?<version>[0-9]+\.[0-9]+\.[0-9]+)(?:-(?<channel>rc|beta|alpha)\.(?<serial>[0-9]+))?$/;
const DEPENDENCY_TYPES: readonly DependencyType[] = ['dependencies', 'devDependencies', 'peerDependencies'];
const PACKAGE_ROOT_RELATIVE = 'packages/bijou/package.json';

function readJsonFile<T>(filepath: string): T {
  return JSON.parse(readFileSync(filepath, 'utf8')) as T;
}

export function readWorkspacePackages(root: string): readonly WorkspacePackage[] {
  const rootManifest = readJsonFile<RootWorkspaceManifest>(join(root, 'package.json'));
  const workspaces = rootManifest.workspaces;
  let workspacePatterns: readonly string[] | undefined;

  if (Array.isArray(workspaces)) {
    workspacePatterns = workspaces;
  } else if (workspaces && 'packages' in workspaces) {
    workspacePatterns = workspaces.packages;
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
      manifest: readJsonFile<PackageManifest>(manifestPath),
    }))
    .sort((left, right) => left.manifest.name.localeCompare(right.manifest.name));
}

export function readCurrentWorkspaceVersion(root: string): string {
  const manifestPath = join(root, PACKAGE_ROOT_RELATIVE);
  return readJsonFile<PackageManifest>(manifestPath).version;
}

export function parseReleaseTag(tag: string): ReleaseMetadata {
  const match = TAG_PATTERN.exec(tag);
  if (!match?.groups) {
    throw new Error(`Invalid tag format: ${tag}`);
  }

  const tagVersion = match.groups.version + (match.groups.channel ? `-${match.groups.channel}.${match.groups.serial}` : '');
  const channel = match.groups.channel as 'rc' | 'beta' | 'alpha' | undefined;

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

export function validateReleaseVersion(version: string): string {
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`Invalid release version: ${version}`);
  }

  return version;
}

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

export function runReleaseMetadata(argv: readonly string[], io: ReleaseCommandIO = {}): number {
  const root = resolve(io.cwd ?? process.cwd());
  const stdout = io.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr = io.stderr ?? ((text: string) => process.stderr.write(text));

  try {
    const tag = parseOption(argv, '--tag');
    const explicitVersion = parseOption(argv, '--version');
    const notesTag = parseOption(argv, '--notes-tag');
    const notesTagRunId = parseOption(argv, '--notes-tag-run-id');
    const githubOutput = parseOption(argv, '--github-output');
    const useCurrentVersion = hasFlag(argv, '--current-version');

    const versionSources = [tag, explicitVersion, useCurrentVersion ? '__current__' : undefined].filter(Boolean);
    if (versionSources.length !== 1) {
      throw new Error('Specify exactly one of --tag, --version, or --current-version');
    }

    if (notesTag && notesTagRunId) {
      throw new Error('Use either --notes-tag or --notes-tag-run-id, not both');
    }

    let expectedVersion: string;
    let outputs: ReleaseCommandOutputs;
    let packageSummaryLabel: string;

    if (tag) {
      const metadata = parseReleaseTag(tag);
      expectedVersion = metadata.tagVersion;
      outputs = {
        tag: metadata.tag,
        tag_version: metadata.tagVersion,
        is_prerelease: String(metadata.isPrerelease),
        npm_dist_tag: metadata.npmDistTag,
      };
      packageSummaryLabel = 'tag';
    } else {
      expectedVersion = validateReleaseVersion(useCurrentVersion ? readCurrentWorkspaceVersion(root) : explicitVersion!);
      const resolvedNotesTag = notesTagRunId ? `dry-run-v${expectedVersion}-${notesTagRunId}` : notesTag;
      outputs = {
        version: expectedVersion,
        ...(resolvedNotesTag ? { notes_tag: resolvedNotesTag } : {}),
      };
      packageSummaryLabel = 'release';
    }

    const validation = validateWorkspaceVersion(root, expectedVersion);
    printPackageSummary(validation.packages, expectedVersion, packageSummaryLabel, stdout);

    if (validation.errors.length > 0) {
      for (const error of validation.errors) {
        stderr(`::error::${error}\n`);
      }
      stderr(`::error::Workspace version mismatch detected. Run: npm run version ${expectedVersion}\n`);
      return 1;
    }

    if (githubOutput) {
      writeGithubOutput(githubOutput, outputs);
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr(`${message}\n`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = runReleaseMetadata(process.argv.slice(2));
}
