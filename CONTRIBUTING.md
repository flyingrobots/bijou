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

- **Start with a GitHub Issue**: New work intake lives in GitHub Issues, not
  in a new local backlog file. Use the issue forms so the card captures a hill,
  sponsored human/agent perspectives, scope, acceptance criteria, expected
  evidence, and Method artifacts.
- **Labels are tracker state**: Maintainers and agents apply `lane:*`,
  `type:*`, `priority:*`, and `legend:*` labels. Do not treat historical repo
  files as the source of live queue state.
- **Branch naming**: `cycle/<cycle-name>` for cycle work, or a
  descriptive branch name for smaller changes.
- **Open a draft PR at cycle start**: After syncing the merge target, branch,
  create or update the GitHub Issue, and commit the design artifact, push the
  branch and open a draft PR against `main`. Link the issue, design doc, and
  draft PR, then mark it ready for review only after validation and self-review
  pass.
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

## Platform Support

The contributor path is Node-first and should not require a Unix shell for core
local commands. `npm run clean`, `npm run build`, `npm test`, and
`npm run typecheck:test` are expected to work on macOS, Linux, and Windows with
a supported Node.js version.

CI keeps the full Node-version matrix on Ubuntu and adds a focused Node 22
build/typecheck/unit-test lane on macOS and Windows. Interactive terminal
smokes, release publishing, and benchmark artifact jobs can remain
Linux-hosted when they depend on terminal capture tooling, trusted shell
wrappers, or registry workflow behavior.

## Pull Requests

- Open draft PRs against `main` at cycle start for visibility.
- Mark draft PRs ready for review only after local validation and self-review
  pass.
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

Contributions are tracked in GitHub Issues first. Open an issue before starting
work unless a maintainer has already linked one. The issue is the live card; the
repository stores durable evidence created while the work proceeds.

### Lane Labels

| Label | Meaning |
| :--- | :--- |
| `lane:inbox` | Raw intake. The work exists but has not been shaped for a cycle. |
| `lane:asap` | Imminent work. Maintainers expect this to be pulled next. |
| `lane:bad-code` | Known technical debt or cleanup that should not be normalized. |
| `lane:cool-ideas` | Interesting but uncommitted exploration. |
| `lane:release` | Release-boundary shaping or blockers. |

Use `work-in-progress` only when a branch or PR is actively carrying the issue.
Use `blocked` when progress depends on a decision or external state. Use
`needs-design`, `needs-witness`, and `needs-retro` when the evidence ledger is
missing a required artifact.

The repo still contains `docs/method/backlog/`, `docs/design/`,
`docs/method/retro/`, and `docs/method/graveyard/` because those files preserve
history and evidence. They are not the first intake path for new contributors.

For one-off fixes, open a GitHub issue with:

1. A minimal summary of the user-facing issue.
2. Reproduction steps or current repo evidence.
3. Clear success criteria.
4. Expected tests, playback, docs, and closeout evidence.

Implementation work should link the issue from the PR and update
`docs/CHANGELOG.md` when behavior or user-facing documentation changes.

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
