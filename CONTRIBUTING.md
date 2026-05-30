# Contributing to Bijou

Thank you for your interest in contributing to Bijou! This guide
covers the workflow, expectations, and resources for contributors.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies: `npm install`
3. Set up git hooks: `git config --local core.hooksPath scripts/hooks`
4. Run the linter: `npm run lint`
5. Run the test suite: `npm test`
6. Verify docs references: `npm run docs:inventory`

## Development Workflow

Bijou uses [METHOD](docs/METHOD.md) for work tracking. The key
points for contributors:

- **Branch naming**: `cycle/<cycle-name>` for cycle work, or a
  descriptive branch name for smaller changes.
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **Tests first**: Write failing tests before implementing. Never
  modify a test to make it pass — fix the code instead.
- **Zero tolerance**: Lint must pass cleanly. All tests must pass.
  No warnings.

Common validation commands:

- `npm run lint`
- `npm test`
- `npm run docs:inventory`
- `npm run release:readiness` for release-sensitive changes or before cutting a release branch

## Pull Requests

- Open PRs against `main`.
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

## How the Backlog Works

Contributions are tracked in `docs/method/backlog/` and organized into
lanes. Start there, not by inventing a new tracking mechanism.

- `inbox/` is the preferred first touchpoint for contributors.
- `up-next/` holds near-term scheduled work.
- `asap/` captures active priorities.
- `cool-ideas/` contains exploratory follow-on ideas.
- `bad-code/` tracks known anti-pattern cleanup.

For one-off fixes, add a short task to `docs/method/backlog/inbox/` with:

1. A minimal summary of the user-facing issue.
2. Reproduction steps (if applicable).
3. Clear success criteria.
4. Suggested owner and expected verification step.

That file is the expected entry point for all external issue intake.

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

- `docs/method/backlog/inbox/` — add a concise contribution proposal for a
  documentation or onboarding improvement.
- `docs/specs/` — add acceptance criteria or edge-case coverage notes to one
  existing spec.
- `README.md` — improve one command explanation without changing code paths.
- `docs/guides/render-pipeline.md` — add one concrete example that shows
  `RenderState` data exchange between stages.
- `examples/` — remove one source of confusion in an example README without
  changing example behavior.
