# Git Rules

- NEVER push to main without explicit permission
- ALWAYS make changes in feature branches
- ALWAYS PR to main
- NEVER deploy locally or publish locally
- NEVER amend commits
- NEVER rebase
- NEVER force any git operation

# Task Tracking System

## File Layout

| File | Purpose | Lifespan |
|------|---------|----------|
| `TASKS.md` | Current work-in-progress checklist. Step-by-step instructions for the active milestone. | Replaced each milestone. |
| `docs/ROADMAP.md` | Long-term vision: upcoming milestones, future features, backlog (P1–P3). | Persistent. |
| `docs/COMPLETED.md` | Shipped work: finished milestones with summary, date, and PR/commit ref. | Append-only. |
| `docs/GRAVEYARD.md` | Abandoned or indefinitely deferred ideas with rationale for why they were killed. | Append-only. |
| `docs/CHANGELOG.md` | Public-facing release notes per version. | Append-only. |

## Rules

### TASKS.md (the "current sprint")

- Contains a flat checklist (`- [ ]` / `- [x]`) for the active body of work.
- Each item MUST be self-contained: an agent with no prior context can read any unchecked item and execute it. Include file paths, code patterns, and acceptance criteria inline.
- Items are executed top-to-bottom. To resume after context loss, find the first `- [ ]` and start there.
- When ALL items are checked, move a summary entry to `docs/COMPLETED.md`, then replace `TASKS.md` contents with the next milestone's checklist (pulled from `docs/ROADMAP.md`).

### docs/ROADMAP.md (what's next)

- Organized by milestone (e.g. `## vX.Y.Z — Milestone title`).
- Each milestone has phases/tasks described at planning level (not step-by-step — that's TASKS.md's job).
- When a milestone becomes the active work, expand its tasks into `TASKS.md` as a detailed checklist.
- Strike through (`~~task~~`) tasks as they complete; this is a mirror of TASKS.md progress.

### docs/COMPLETED.md (what shipped)

- Append-only log of finished milestones.
- Each entry: milestone name, completion date, one-line summary, link to PR or merge commit.
- Keeps the ROADMAP clean — shipped milestones move here instead of accumulating strikethroughs.

### docs/GRAVEYARD.md (what died)

- Append-only log of ideas that were explored but abandoned or deferred indefinitely.
- Each entry: idea name, date killed, 1–2 sentence rationale (why it was cut, what replaced it, or why it's not worth doing).
- Moving something here is a deliberate decision, not a TODO — it means "we considered this and said no."

## Context Recovery Protocol

When starting a new session or recovering from context exhaustion:

1. Read `TASKS.md` — find the first unchecked item. That's where you are.
2. Read `docs/ROADMAP.md` — understand the current milestone and what comes after.
3. Read `docs/CHANGELOG.md` `[Unreleased]` section — see what's already been done in this cycle.
4. Check `git log --oneline -10` and `git status` — see recent commits and working tree state.

Do NOT re-run audits, re-explore the codebase, or re-plan unless the task description explicitly calls for it. Trust the checklist.

# End of Turn Checklist

At the end of every turn that alters files, ALWAYS:

1. Update docs/CHANGELOG.md if necessary
2. Bump version if necessary
3. Update documentation as needed
4. Update TASKS.md — check off completed items
5. `git add -A`
6. `git commit` with a conventional commit message
