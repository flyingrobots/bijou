import { readFileSync } from 'node:fs';

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

export type ReleaseCommandOutputs = Readonly<Record<string, string>>;

const SEMVER_INT = '(?:0|[1-9][0-9]*)';

const VERSION_PATTERN = new RegExp(
  `^${SEMVER_INT}\\.${SEMVER_INT}\\.${SEMVER_INT}(?:-(rc|beta|alpha)\\.${SEMVER_INT})?$`,
);

const TAG_PATTERN = new RegExp(
  `^v(?<version>${SEMVER_INT}\\.${SEMVER_INT}\\.${SEMVER_INT})(?:-(?<channel>rc|beta|alpha)\\.(?<serial>${SEMVER_INT}))?$`,
);

const DEPENDENCY_TYPES: readonly DependencyType[] = ['dependencies', 'devDependencies', 'peerDependencies'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireJsonRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} is not a JSON object`);
  return value;
}

function readJsonObject(filepath: string): Record<string, unknown> {
  return requireJsonRecord(JSON.parse(readFileSync(filepath, 'utf8')), filepath);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function readDependencyMap(value: unknown, label: string): DependencyMap | undefined {
  if (value === undefined) return undefined;
  const record = requireJsonRecord(value, label);
  const deps: DependencyMap = {};
  for (const [name, version] of Object.entries(record)) {
    if (typeof version !== 'string') throw new Error(`${label} has a non-string version for ${name}`);
    deps[name] = version;
  }
  return deps;
}

function readPackageManifest(filepath: string): PackageManifest {
  const manifest = readJsonObject(filepath);
  const name = manifest['name'];
  const version = manifest['version'];
  if (typeof name !== 'string' || typeof version !== 'string') {
    throw new Error(`${filepath} is missing a string name or version`);
  }
  const dependencies = readDependencyMap(manifest['dependencies'], `${filepath} dependencies`);
  const devDependencies = readDependencyMap(manifest['devDependencies'], `${filepath} devDependencies`);
  const peerDependencies = readDependencyMap(manifest['peerDependencies'], `${filepath} peerDependencies`);
  return {
    name,
    version,
    ...(dependencies === undefined ? {} : { dependencies }),
    ...(devDependencies === undefined ? {} : { devDependencies }),
    ...(peerDependencies === undefined ? {} : { peerDependencies }),
  };
}

export { DEPENDENCY_TYPES, INTERNAL_PACKAGE_PREFIX, TAG_PATTERN, VERSION_PATTERN, isRecord, isString, readJsonObject, readPackageManifest };
