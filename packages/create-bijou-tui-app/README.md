# `create-bijou-tui-app`

Scaffold a new Bijou TUI app with a batteries-included default shell.

## Usage

```sh
npm create bijou-tui-app@latest my-app
cd my-app
npm run dev
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
