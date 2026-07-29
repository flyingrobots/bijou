/**
 * Create scaffolded file contents keyed by relative file path.
 */
export function createTemplateFiles(packageName: string): Readonly<Record<string, string>> {
  const pkg = {
    name: packageName,
    private: true,
    type: 'module',
    scripts: {
      dev: 'tsx src/main.ts',
      build: 'tsc -p tsconfig.json',
      start: 'node dist/main.js',
    },
    dependencies: {
      '@flyingrobots/bijou': 'latest',
      '@flyingrobots/bijou-node': 'latest',
      '@flyingrobots/bijou-tui': 'latest',
      '@flyingrobots/bijou-tui-app': 'latest',
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      tsx: '^4.21.0',
      typescript: '^5.9.3',
    },
  };

  const tsconfig = {
    compilerOptions: {
      target: 'ESNext',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      noUncheckedIndexedAccess: true,
      noImplicitOverride: true,
      noPropertyAccessFromIndexSignature: true,
      skipLibCheck: true,
      outDir: 'dist',
      rootDir: 'src',
    },
    include: ['src/**/*.ts'],
    exclude: ['node_modules', 'dist'],
  };

  const mainTs = `import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { createTuiAppSkeleton } from '@flyingrobots/bijou-tui-app';

const ctx = initDefaultContext();

await run(
  createTuiAppSkeleton({
    ctx,
    title: 'My Bijou App',
    statusMessage: ({ activeTabTitle }) => \`\${activeTabTitle} ready\`,
  }),
  { mouse: true },
);
`;

  const readme = `# ${packageName}

Scaffolded with \`create-bijou-tui-app\`.

This starter is for app-like TUIs with:
- peer destinations in tabs
- shell status and command discovery
- supplemental side work in a drawer
- blocking review/quit flows in a modal

Avoid this starter for one-shot CLI or prompt-first flows that do not need a framed shell.

## Run

\`\`\`sh
npm install
npm run dev
\`\`\`

## Default shell patterns

The default shell includes:
- full-screen framed app layout
- two starter tabs:
  - Home: primary workspace plus a supplemental drawer
  - Split: comparison/inspection layout
- command palette and help integration
- mouse enabled by default for shell chrome and pointer-capable surfaces
- quit confirmation on \`q\` / \`ctrl+c\`

## Customize next

- replace the starter tabs with real destinations
- repurpose the drawer for filters, context, logs, or side-work inspection
- keep destructive or blocking decisions in modal flows
`;

  return {
    '.gitignore': 'node_modules\ndist\n',
    'package.json': `${JSON.stringify(pkg, null, 2)}\n`,
    'tsconfig.json': `${JSON.stringify(tsconfig, null, 2)}\n`,
    'README.md': `${readme}\n`,
    'src/main.ts': mainTs,
  };
}
