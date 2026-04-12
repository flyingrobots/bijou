# AGENTS

This guide is for AI agents and human operators recovering context in the Bijou repository.

## Git Rules

- **NEVER** amend commits.
- **NEVER** rebase or force-push.
- **NEVER** push to `main` without explicit permission.
- Always use standard commits and regular pushes.

## Documentation & Planning Map

Do not audit the repository by recursively walking the filesystem. Follow the authoritative manifests:

### 1. The Entrance
- **`README.md`**: Public front door, package roles, and quick start.
- **`GUIDE.md`**: Orientation, the fast path, and monorepo orchestration.
- **`docs/README.md`**: Documentation entrypoint and intent-based map.

### 2. The Bedrock
- **`ARCHITECTURE.md`**: The authoritative structural reference (Ports, Adapters, Package Stack).
- **`docs/VISION.md`**: Core tenets and project identity.
- **`docs/METHOD.md`**: Repo work doctrine (Backlog lanes, Cycle loop).

### 3. The Direction
- **`docs/BEARING.md`**: Current execution gravity and active tensions.
- **`docs/ROADMAP.md`**: Broad strategic horizon and phase targets.
- **`docs/BACKLOG/`**: The active source of truth for pending work.
- **`docs/design/`**: Active and landed cycle design documents.

### 4. The Proof
- **`docs/DOGFOOD.md`**: Canonical documentation app and proving ground.
- **`docs/CHANGELOG.md`**: Historical truth of merged behavior.

## Context Recovery Protocol

When starting a new session or recovering from context loss:

1. **Read `docs/BEARING.md`** to find the current execution gravity.
2. **Read `docs/METHOD.md`** to understand the work doctrine.
3. **Read the relevant backlog item** in `docs/BACKLOG/asap/`.
4. **Read the latest relevant section** of `docs/CHANGELOG.md`.
5. **Check `git log -n 5` and `git status`** to verify the current branch state.

## End of Turn Checklist

After altering files:

1. **Verify Truth**: Ensure documentation is updated if behavior or structure changed.
2. **Log Debt**: Add follow-on backlog items if technical debt was deferred.
3. **Commit**: Use focused, conventional commit messages. Propose a draft before executing.
4. **Validate**: Run `npm run lint` and relevant tests.

---
**The goal is inevitability. Every feature is defined by its tests.**
