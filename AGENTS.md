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
- The DOGFOOD localization touched-file rule remains binding: if a branch
  touches a DOGFOOD TypeScript source file that still has raw visible-copy debt,
  clean that file or prove the strings non-localizable by scanner policy.

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

Do not audit the repository by recursively walking the filesystem. Follow the authoritative manifests:

### 1. The Entrance
- **`README.md`**: Public front door, package roles, and quick start.
- **`GUIDE.md`**: Orientation, the fast path, and monorepo orchestration.
- **`docs/README.md`**: Documentation entrypoint and intent-based map.

### 2. The Bedrock
- **`ARCHITECTURE.md`**: The authoritative structural reference (Ports, Adapters, Package Stack).
- **`docs/VISION.md`**: Core tenets and project identity.
- **`docs/DOCUMENTATION_STANDARDS.md`**: Reader-task documentation policy,
  corpus ownership, examples, accessibility, and upkeep gates.
- **`docs/typescript-code-standards.editors-edition.md`**: Verbatim TypeScript Code Standards doctrine for humans and agents touching TypeScript, tests, adapters, scripts, or architecture.
- **`docs/code-dojo-exceptions.md`**: Human exception ledger and 50-violation-per-goalpost burndown policy.

### 3. The Direction
- **`docs/design/`**: Active and landed cycle design documents.

### 4. The Proof
- **`docs/DOGFOOD.md`**: Canonical documentation app and proving ground.
- **`docs/CHANGELOG.md`**: Historical truth of merged behavior.

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
