# Contributing to Bijou

Thank you for your interest in contributing to Bijou! This guide
covers the workflow, expectations, and resources for contributors.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies: `npm ci`. Its prepare step installs `.githooks`.
3. Prepare the sealed Docker toolchain described in [Running tests](docs/guides/sealed-tests.md).
4. Run the linter: `npm run lint`
5. Run the test suite: `npm test`
6. Verify docs references: `npm run docs:inventory`

## Development Workflow

Use GitHub issues and milestones for roadmap and release scope. Linear is the
chosen execution tracker; the connection and workspace/team migration are still
pending. Existing GitHub issues remain live until verified Linear links exist.
See [the workflow](docs/book/bijou-designs.pdf#page=1467) for the current process.

- Name one observable outcome, its scope, acceptance checks, and prerequisites.
- Use a descriptive branch and one coherent PR per outcome.
- Link the work item and PR; request review after validation and self-review.
- Use Conventional Commits and meaningful regression checks.
- Preserve design and release evidence without maintaining a second backlog.

Common validation commands:

- `npm run lint`
- `npm test`
- `npm run docs:inventory`
- `npm run release:readiness` for release-sensitive changes or before cutting a release branch

## Platform Support

Tests require Docker. The launcher copies source and independent Git state into
a disposable container; test processes cannot write into the original checkout.
Git hooks run no tests; the pre-commit hook runs only fast Code Dojo checks. Run
`npm run verify:sealed` before a release. Direct test runners refuse host execution.
See [Running tests](docs/guides/sealed-tests.md) for setup and evidence limits.

CI retains the full Node-version matrix on Linux and a focused Node 22 Windows
lane. A Linux container on a Windows or macOS host provides Linux evidence;
it does not establish native Windows or macOS behavior. Windows checks require
Windows containers. macOS-specific test coverage remains an explicit limitation
of the Docker-only policy. Publishing credentials stay outside test containers.

## Pull Requests

- Open focused PRs against `main` and link the work item.
- Request final review only after local validation and self-review pass.
- Use `--body-file` for Markdown-heavy GitHub comments. Inline `--body "..."`
  is only safe for short literal comments that do not contain backticks,
  `$()` text, command examples, or Markdown tables.
- Keep PRs focused — one concern per PR.
- Update `docs/CHANGELOG.md` if the change is user-facing.
- Update relevant documentation when behavior changes.
- All CI checks must pass before merge.

## What to Contribute

- **Bug fixes**: Always welcome. Include a test that reproduces the
  bug.
- **Documentation**: Improvements to READMEs, guides, and examples
  are valuable.
- **New components**: Discuss in an issue first to align on the
  design-system fit.
- **Performance**: The `examples/perf-gradient` demo is a proving
  surface. Benchmarks welcome.

## Work Tracking

The [GitHub issue tracker](https://github.com/flyingrobots/bijou/issues) and
[milestones](https://github.com/flyingrobots/bijou/milestones) replace repository
roadmap files. During the Linear migration, preserve source issue links and
verify imported scope, acceptance criteria, status, and dependencies before
changing ownership. Do not close source issues just because they were exported.

The [documentation book](docs/book/bijou-designs.pdf) preserves historical
design, METHOD, and release evidence. Record new technical decisions and release
proof in the linked issue or pull request; do not recreate repository planning
cards. The book corpus remains available to DOGFOOD and historical checks.

## Code Style

- TypeScript strict mode.
- No `any` unless unavoidable (and documented why).
- Prefer pure functions and immutable data.
- Platform APIs go through ports (`IOPort`, `StylePort`, etc.) —
  never import `process`, `fs`, or `readline` in core packages.

## Questions?

Open an issue or check the [documentation map](docs/README.md) for
existing guidance.

## Good First Issues

Start here if this is your first contribution:

- GitHub Issues labeled `lane:inbox` and `priority:low` — propose or pick a
  focused documentation or onboarding improvement.
- `docs/specs/` — add acceptance criteria or edge-case coverage notes to one
  existing spec.
- `README.md` — improve one command explanation without changing code paths.
- `docs/guides/render-pipeline.md` — add one concrete example that shows
  `RenderState` data exchange between stages.
- `examples/` — remove one source of confusion in an example README without
  changing example behavior.
