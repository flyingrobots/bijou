export interface InputStep {
  readonly type: 'input';
  readonly input: string;
  readonly delayMs?: number;
}

export interface ResizeStep {
  readonly type: 'resize';
  readonly cols: number;
  readonly rows: number;
  readonly delayMs?: number;
}

export type PtyStep = InputStep | ResizeStep;

interface PackageManifest {
  readonly name?: string;
  readonly version?: string;
  readonly private?: boolean;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

type DependencySection =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'optionalDependencies';

const RAW_SURFACE_PATTERNS = [
  /cells:\s*\[/,
  /clear:\s*\[Function:/,
  /transform:\s*\[Function:/,
  /width:\s*\d+,\s*\n\s*height:\s*\d+/,
  /\[object Object\]/,
];

const ERROR_PATTERNS = [
  /\[Pipeline Error\]/,
  /\bTypeError:/,
  /\bReferenceError:/,
  /\bSyntaxError:/,
  /\bUnhandled\b/i,
];

export function inputStep(input: string, delayMs?: number): InputStep {
  return { type: 'input', input, delayMs };
}

export function resizeStep(cols: number, rows: number, delayMs?: number): ResizeStep {
  return { type: 'resize', cols, rows, delayMs };
}

export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

export function detectGarbage(cleanOutput: string): string | null {
  for (const pattern of RAW_SURFACE_PATTERNS) {
    if (pattern.test(cleanOutput)) {
      return `raw Surface dump matched ${pattern}`;
    }
  }

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(cleanOutput)) {
      return `error output matched ${pattern}`;
    }
  }

  return null;
}

export function rewritePackageManifestToTarballs(
  packageJsonSource: string,
  tarballSpecs: Readonly<Record<string, string>>,
): string {
  const manifest = JSON.parse(packageJsonSource) as PackageManifest;
  const sections: readonly DependencySection[] = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ];

  for (const section of sections) {
    const deps = manifest[section];
    if (deps == null) continue;
    for (const [name, spec] of Object.entries(deps)) {
      const tarballSpec = tarballSpecs[name];
      if (tarballSpec == null) continue;
      if (spec !== tarballSpec) {
        deps[name] = tarballSpec;
      }
    }
  }

  return `${JSON.stringify(manifest, null, 2)}\n`;
}
