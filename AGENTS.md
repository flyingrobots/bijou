# AGENTS

This guide is for AI agents and human operators recovering context in the Bijou repository.

## Git Rules

- **NEVER** amend commits.
- **NEVER** rebase or force-push.
- **NEVER** push to `main` without explicit permission.
- Always use standard commits and regular pushes.
- Post Markdown-heavy GitHub comments through `--body-file` with a quoted
  heredoc or body file. Do not inline shell-sensitive review/comment bodies
  through `--body "..."`.

## CODE_STANDARDS

- **All tests run in sealed Docker copies**, including focused tests, smoke
  harnesses, benchmarks, release gates and CI. Before executing validation, read
  `docs/guides/sealed-tests.md`. Use the guarded launcher with copy-in source,
  independent Git storage and remotes removed. Host test execution, host source
  mounts, Docker-socket exposure and environment-only guard bypasses are forbidden.
  Report a refused run as blocked; preserve its evidence and fix the boundary.

- **Tests are a merge gate and a release gate, not a commit gate.** Git hooks run
  only the fast dependency-free Code Dojo checks on the host (`.githooks/pre-commit`);
  there is no pre-push hook. GitHub CI on the exact head gates every merge. Before
  a release, `npm run verify:sealed` runs the full former commit and push gates in
  the seal, and the publish workflow runs the suite sealed on GitHub. Run the seal
  locally whenever you want an answer before CI (flyingrobots/bijou#956).

- **Two test jobs run outside the seal, on purpose. The first is the browser suite of
  `examples/web-gpu`** (`npm run test:browser:web-gpu`, CI job "Browser Suite
  (web-gpu, Chrome)"). The sealed workers have no browser and no GPU, and a
  build-only check is not evidence that a page renders. It drives the built showcase in a real Chrome and nothing else: it
  is not a place for unit tests, and `tests/web-gpu/ci-browser-job.test.ts`
  holds its CI job to `npm ci` plus the suite. Everything that does not need a
  browser, including the showcase's build and typecheck, stays in the seal.
  Record which browser, adapter and evidence level produced a result.

- **The second exception is the Windows CI job** ("Focused Unit Tests (windows,
  Node 22, outside the seal)"). The sealed Windows worker ran out of storage
  before any test started, so the job runs the focused tests directly on a fresh
  GitHub-hosted Windows virtual machine. It runs only in CI:
  `scripts/vitest-windows.config.ts` refuses to load anywhere else, and
  `tests/ci-windows-job.test.ts` holds the job to its install, build, test
  typecheck and that config. Windows is cursed. Handle it with extreme caution: never breathe
  near it, hold it at arm's length, cross your fingers, and swear under your
  breath whenever it is the only build that fails. Then fix the failure; never
  retry it until it passes. See `docs/guides/sealed-tests.md`.

- The canonical standards artifact is
  **`docs/typescript-code-standards.editors-edition.md`**, copied verbatim from
  the TypeScript Code Standards Editor's Edition source package. Humans and
  agents must read it before making substantive TypeScript, test, adapter,
  script, or architecture changes.
- Do not fork that artifact with local edits. Refresh it from the source package
  when the upstream standards change; keep Bijou-specific enforcement policy in
  this file, package scripts, hooks, workflows, and design documents.
- The standards package is installed with Bijou-specific plumbing: keep npm,
  the project-reference root `tsconfig.json`, and the existing Bijou
  `scripts/hooks/` gates unless a cycle explicitly changes that infrastructure.
- Default enforcement runs through `npm run code:size`, `npm run
  code-dojo:precommit`, `npm run code-dojo:prepush`, and `npm run
  code-dojo:ci`. `npm run code-dojo:strict` is part of the default CI path, not
  an optional aspirational check.
- Code Dojo baseline files under `scripts/code-dojo/baselines/` are ratchets.
  Existing entries may hold or shrink. New entries, grown baselines, or
  softened thresholds require explicit design-review justification.
- `docs/code-dojo-exceptions.md` is the human exception ledger. Every met repo
  goalpost must reduce the aggregate `npm run code-dojo:debt` count by at
  least 50 violations until zero. This goalpost burndown is additive to all
  other touched-file rules, ratchets, CI gates, review gates, and release gates.
- The active code-size ratchet is part of the standards posture: no source file
  over 1,000 lines unless it is named as legacy debt in the code-size baseline;
  files over 500 lines must be explicitly baselined and may hold or shrink, not
  grow.
- The DOGFOOD localization touched-file rule remains binding (scope set by
  `docs/design/DL-037-dogfood-touched-file-scope.md`): if a branch touches a
  DOGFOOD TypeScript source file, it must not add or modify raw visible copy
  without localizing it, and a touched file that still has raw-string debt must
  end with fewer entries than its base (at least one fewer). Whole-file cleanup
  is not required. This is not permission to keep debt: the aggregate and
  per-surface baselines still hold or shrink, and dedicated localization tasks
  carry the burndown. Strings may instead be proved non-localizable by scanner
  policy.

## Design Vocabulary

- Always use Bijou's design vocabulary in code comments, documentation, issues,
  pull requests, example apps, and on-screen copy:
  **`docs/topics/design-vocabulary.md`**. It collects the canonical terms,
  component family fields, and writing style from the Bijou book's
  Documentation Standards (R45), Component Families (R52), Content Guide (R15),
  and Localization and Bidirectionality (R26) records.
- Use one canonical term per concept: Component, Block, Surface, family, variant,
  and the output modes `interactive`, `static`, `pipe`, and `accessible`.
- Document component families with the R52 fields, in order: Family, Variants,
  Use when, Avoid when, Content guidance, Ownership, Graceful lowering, and
  Related families. Do not document components by comparison to other design
  systems.
- When new vocabulary is needed, add it to `docs/topics/design-vocabulary.md`
  in the same change rather than coining a term in one place.

## Work Tracking

- GitHub Issues and milestones are the roadmap and release-scope authority.
- Linear is the chosen execution tracker. Migration is pending connection and
  selection of the workspace/team; until then, existing GitHub issues remain live.
- Do not create repository backlog files or maintain release-count mirrors.
- Keep one observable outcome per issue and one independently mergeable PR per
  outcome. Link the issue, PR, and resulting integration commit.
- Use descriptive branches. Design records are useful for consequential changes;
  cycle names, advance shaping commits, sponsor fields, and retrospective
  ceremonies are not required.
- Record scope, acceptance checks, actual prerequisites, and validation evidence
  in the work item. Preserve existing design and release evidence as history.
- Request review after implementation, validation, and self-review are complete.
- Never close or delete source tracker items merely because a migration is planned.

## Documentation & Planning Map

- **`.claude/skills/bijou/SKILL.md`**: read before building or changing a Bijou app, choosing a
  component, theming, adding motion, localizing, or testing and recording Bijou output.
- **`README.md`**: public front door and package quick start.
- **`docs/README.md`**: live documentation map and bounded chapter-reading command.
- **[Teaching book](https://github.com/flyingrobots/bijou-job-monitor/tree/main/book)**:
  canonical five-part book, workshops and application live in the companion repo.
- **`docs/book/bijou-archive.pdf`** and **`docs/book/bijou-archive.tex`**:
  all 426 preserved historical source records, identified as R1–R426.
- **`docs/book/bijou-designs.pdf`** and **`docs/book/bijou-designs.tex`**:
  frozen complete edition with historical appendices; existing links target this PDF.
  Its teaching snapshot lives in `docs/book/history/complete-edition-2026-10-20/`.
- **`docs/book/source-manifest.json`**: original paths, chapter numbers and hashes.
- **`docs/book/source-corpus.json`**: exact archived text used by DOGFOOD and checks;
  individual compiled Markdown files have been removed.
- **`docs/typescript-code-standards.editors-edition.md`** and
  **`docs/code-dojo-exceptions.md`**: retained live engineering policy.
- **`docs/topics/design-vocabulary.md`**: canonical terms, component family
  fields, and writing style for every surface.
- **`docs/CHANGELOG.md`**: ongoing merged-behavior history.

Read an archived source in bounded excerpts with
`node --import tsx scripts/read-documentation.ts ORIGINAL_PATH START_LINE LIMIT`.
The limit is at most 250 lines. Inspect the manifest for chapter identity before
reading; do not dump the entire corpus or LaTeX file into agent context.
Roadmap and release scope remain in GitHub issues and milestones.

## Context Recovery Protocol

When starting a new session or recovering from context loss:

1. Inspect open GitHub issues, milestones, and pull requests for current scope.
2. Inspect the linked Linear work item once the migration is connected.
3. Read the relevant design or release evidence and latest changelog section.
4. Check `git log -n 5`, `git status`, and worktrees before changing anything.

## End of Turn Checklist

After altering files:

1. **Verify Truth**: Ensure documentation is updated if behavior or structure changed.
2. **Log Debt**: Record follow-up tracker issues if technical debt was deferred.
3. **Commit**: Use focused, conventional commit messages. Propose a draft before executing.
4. **Validate**: Run `npm run lint` and relevant tests.

---
**The goal is inevitability. Every feature is defined by its tests.**
