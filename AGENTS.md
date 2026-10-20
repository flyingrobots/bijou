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

- **`README.md`**: public front door and package quick start.
- **`docs/README.md`**: live documentation map and bounded chapter-reading command.
- **`docs/book/bijou-book.pdf`** and **`docs/book/bijou-book.tex`**:
  five-part teaching book, seven workshops and practical reference.
- **`docs/book/bijou-archive.pdf`** and **`docs/book/bijou-archive.tex`**:
  all 426 preserved historical source records, identified as R1–R426.
- **`docs/book/bijou-designs.pdf`** and **`docs/book/bijou-designs.tex`**:
  complete teaching edition with historical appendices; existing links target this PDF.
- **`docs/book/source-manifest.json`**: original paths, chapter numbers and hashes.
- **`docs/book/source-corpus.json`**: exact archived text used by DOGFOOD and checks;
  individual compiled Markdown files have been removed.
- **`docs/typescript-code-standards.editors-edition.md`** and
  **`docs/code-dojo-exceptions.md`**: retained live engineering policy.
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
