# Package Development Guide

This guide describes the minimum steps to add a new package to the Bijou
monorepo without breaking workspace conventions.

## Why the packages are split

Bijou keeps package boundaries narrow so apps can adopt only the layer they
need:

- `@flyingrobots/bijou` is pure TypeScript and owns surfaces, components,
  blocks, themes, and port contracts.
- `@flyingrobots/bijou-node` adapts those ports to Node.js, terminal IO,
  filesystem access, and host environment detection.
- `@flyingrobots/bijou-tui` owns the interactive TEA runtime, key/input
  routing, layout, animation, and render pipeline.
- `@flyingrobots/bijou-tui-app` owns the batteries-included framed shell.
- `create-bijou-tui-app` gives app authors a project scaffold instead of
  asking them to assemble the shell manually.
- i18n packages are split between runtime lookup and authoring/workflow tools
  so apps do not import CSV, TSV, XLSX, or filesystem tooling at runtime.

That split adds workspace setup cost, but it keeps pure rendering independent
from host IO and lets small CLIs avoid full TUI shell dependencies.

## 1) Create package scaffold

Create a package directory under `packages/<name>/` with:

- `package.json`
- `tsconfig.json` with composite references
- source folder (usually `src/`)
- optional test folder and build artifacts

A minimal `package.json` follows this shape:

```json
{
  "name": "@flyingrobots/bijou-<package>",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest --run --config ../../vitest.config.ts"
  },
  "dependencies": {
    "@flyingrobots/bijou": "workspace:*"
  }
}
```

## 2) Register in the workspace

The root workspace uses globs (`packages/*`), so no explicit package list
change is required for package discovery if you keep the package under
`packages/`.

## 3) Wire TypeScript project references

For workspace `tsc -b` execution to compile your package correctly:

1. Ensure package `tsconfig.json` has `composite: true` and
a valid `references` array.
2. Add a package-level `tsconfig.tsbuildinfo` entry under `tsconfig`
   conventions as needed.
3. Keep `rootDir`/`outDir` under `src` and `dist`.

## 4) Connect ports and context where relevant

Packages that contribute runtime behavior should pass through the port and
context abstractions:

- **Runtime side**: export `RuntimePort` implementations (`@flyingrobots/bijou`).
- **IO side**: keep terminal/file/timer interactions on `IOPort`.
- **Style side**: keep color and formatting behind `StylePort`.

Never import `process` or `fs` in core packages. If you need host
access, move it into an adapter package and inject through ports.

## 5) Export surfaces and contracts in a public API file

Use a package-level `src/index.ts` to aggregate public exports and keep
import paths stable for consumers.

```ts
export * from './runtime.js';
export * from './types.js';
```

## 6) Add tests and docs

Every added public function should include at least:

- Unit test coverage.
- A short fixture or usage example.
- Package README section describing setup and API shape.

## 7) Add to user-facing docs

For discoverability:

- Add/update the root package map entry if the package is user-facing.
- Add the package README excerpt to `README.md` Package Map when needed.
- Add any new API docs under `docs/` and cross-link from the appropriate
  architecture or GUIDE file.
