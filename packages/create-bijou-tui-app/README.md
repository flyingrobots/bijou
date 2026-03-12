# `create-bijou-tui-app`

Scaffold a new Bijou TUI app with batteries-included defaults.

## What's New in v3.0.0

- **Canonical V3 starter** — generated apps target the current `@flyingrobots/bijou-tui` + `@flyingrobots/bijou-tui-app` path instead of an older string-only shell story.
- **Public API only** — the scaffolded app uses public package APIs so it can serve as a downstream canary for real-world upgrades.
- **Release-aligned defaults** — the generated project matches the same shell/runtime split described in the root docs and migration guide.

## Usage

```sh
npm create bijou-tui-app@latest my-app
cd my-app
npm run dev
```

The generated app can also be run directly with:

```sh
npx tsx src/main.ts
```

## What it generates

- TypeScript Node app entrypoint using `createTuiAppSkeleton()`
- Dependencies:
  - `@flyingrobots/bijou`
  - `@flyingrobots/bijou-node`
  - `@flyingrobots/bijou-tui`
  - `@flyingrobots/bijou-tui-app`
- Starter scripts: `dev`, `build`, `start`
- Strict `tsconfig.json`

## Flags

- `-h`, `--help`: show usage
- `-y`, `--yes`, `--force`: allow writing into a non-empty target directory
- `--install`: run dependency installation (default)
- `--no-install`: skip dependency installation

## Test this scaffolder locally (from this monorepo)

From the repository root:

```sh
# Run scaffolder unit tests
npx vitest run --config vitest.config.ts packages/create-bijou-tui-app/src/index.test.ts

# Smoke-test generated files without installing dependencies
TMP="$(mktemp -d /tmp/bijou-scaffold-XXXXXX)"
TARGET="$TMP/my-app"
npx tsx packages/create-bijou-tui-app/src/cli.ts "$TARGET" --no-install
find "$TARGET" -maxdepth 2 -type f | sort

# Run the generated app
cd "$TARGET"
npm install
npm run dev
```

For upgrade notes and architecture context, see [`../../docs/MIGRATING_TO_V3.md`](../../docs/MIGRATING_TO_V3.md) and [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).
