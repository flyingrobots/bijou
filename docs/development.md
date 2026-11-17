# Developing Bijou

This is the contributor reference for the workspace, verification commands, localization workflow, and component previews. To try the framework first, use the [README](../README.md); for application authoring, use [Build your first Bijou app](./guides/getting-started.md).

The `examples/` tree is runnable secondary/internal reference material; DOGFOOD is the live documentation application.

## Prerequisites

- Node.js 20.19.0 or newer in the 20.x line, or Node.js 22.12.0 or newer
- Node.js 22.12 or newer is recommended for local development
- npm 8+ (or your preferred npm-compatible package manager)
- A running Docker daemon for all tests; see [sealed test setup](./guides/sealed-tests.md).

The repository development toolchain is tested against Node.js 20 and 22 in
CI. Newer Node.js versions are supported by policy; the repository enforces the
same `^20.19.0 || >=22.12.0` floor before install because Vitest 4.1 and its
Vite/Rolldown runtime require that range.

Core build and unit-test coverage runs on Ubuntu for Node 20/22, with focused
Ubuntu and Windows Node 22 lanes for portable path and bootstrap checks.
Contributor-facing root scripts such as `npm run clean` and
`npm run version` are Node scripts so they do not require a Unix shell.
Maintainers on macOS run the sealed Linux container locally; this does not
establish native macOS runtime coverage. Release, publish, and
benchmark workflows may still use Linux-hosted Bash where the workflow itself is
intentionally platform-specific.

## Running Tests

All test entrypoints use the [sealed Docker runner](./guides/sealed-tests.md).
It copies source into independent Git storage without remotes or host mounts;
tests run with networking disabled. Git hooks use the same boundary.

The test launcher builds the copied workspace before running tests:

```bash
npm test
```

`npm test` runs the unit and contract suite. For the complete local release
sequence, run `npm run release:readiness`; it also runs:

- DOGFOOD coverage gate
- interactive example smoke checks
- canary smoke tests
- PTY smoke tests

For long-running verification runs:

- `npm run soak`
- `npm run bench`

PTY checks create their terminals inside the sealed container and do not require
an interactive host terminal. Host environment variables that skip tests are
not forwarded into the worker.

## Localization And i18n

Localization is split into runtime and tooling packages.

- [`@flyingrobots/bijou-i18n`](../packages/bijou-i18n/) resolves catalog lookup, fallback behavior, and missing-string policy.
- [`@flyingrobots/bijou-i18n-tools`](../packages/bijou-i18n-tools/) handles source tables, hashing, diffing, pseudo-localization, and validation.

DOGFOOD localization source lives in:

```text
examples/docs/i18n/source/dogfood-strings.csv
```

Useful scripts:

```bash
npm run dogfood:i18n:build
npm run dogfood:i18n:check
npm run dogfood:i18n:complete
npm run dogfood:i18n:coverage
```

Runtime uses English as fallback and overlays the selected locale. Development mode keeps missing translations visible instead of silently hiding them.

Policy: when a branch adds, edits, or removes a DOGFOOD localization key, it
must apply the semantic change across every supported DOGFOOD locale (`en`,
`fr`, `es`, and `de`). `npm run dogfood:i18n:complete` checks changed
localization keys against `origin/main` and ratchets the full missing
translation count. `npm run dogfood:i18n:debt` also enforces the touched-file
rule: if a branch touches a DOGFOOD TypeScript source file with raw visible-copy
debt, that file must be cleaned instead of merely keeping the global ratchet
flat. Pre-push and CI run those gates with `npm run dogfood:i18n:check` so new
strings cannot land with missing generated catalogs, untranslated
supported-locale rows, or newly touched raw-string debt.

### Localizing a component story

A Component story's docs, variant labels, and preview copy are static fields,
so a story opts in by exporting a factory and a `localize` hook. The
`guidedFlow()` story (`examples/docs/stories-story-guided-flow.ts`) is the
reference:

1. Put every visible string in a sibling `stories-story-<id>-copy.ts` as a
   literal `dogfoodText(localization, 'stories.<storyId>.<key>', 'English')`
   call. The debt scanner only exempts literals passed directly to
   `dogfoodText`, and the sibling file keeps both files inside Code Dojo size
   limits.
2. Export `createXStory(localization?)` that builds the story from that copy,
   set `localize: createXStory` on it, and export the English default as
   `createXStory()`.
3. Add `en`, `fr`, `es`, and `de` rows to `dogfood-strings.csv`, run
   `npm run dogfood:i18n:build`, and lower the story's entry in
   `i18n-debt-baseline-stories.ts`.

The story pane calls `localizeStory(story, localization)`
(`app-story-catalog.ts`), which applies `localize` when present and returns
other stories unchanged. Code names such as `explainability()` stay untranslated.

## BlockLab And Preview Workflow

Run focused previews without entering the full DOGFOOD structure:

```bash
npm run blocklab
npm run blocklab:index
```

`blocklab:index` is especially useful for deterministic fixture capture and
API review. The older `storybook`, `storybook:index`, and `dogfood:storybook`
script names remain as compatibility aliases during the rename window.

## Tests, Soak, and Performance

Useful command set while working:

```bash
npm run lint
npm run typecheck:test
npm test
npm run docs:inventory
npm run verify:interactive-examples
npm run smoke:dogfood
npm run smoke:dogfood:landing
npm run smoke:dogfood:docs
npm run soak
npm run bench
```

`npm run bench` runs core rendering and diff benchmarks for short-cycle comparisons. `npm run soak` keeps the runtime under longer, stress-oriented load.

## Contributing

See [`CONTRIBUTING.md`](../CONTRIBUTING.md) for workflow and PR expectations.

- Start with [GitHub issues](https://github.com/flyingrobots/bijou/issues) and
  the current [agent and contributor agreements](../AGENTS.md).
