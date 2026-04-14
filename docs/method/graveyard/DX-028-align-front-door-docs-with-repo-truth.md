---
title: DX-028 — Align front-door docs with repo truth
legend: DX
lane: graveyard
---

# DX-028 — Align front-door docs with repo truth

## Disposition

Completed on 2026-04-14 via README, CONTRIBUTING, and SECURITY updates that align the front door with the shipped package surface, preferred startApp() bootstrap path, npm workspace workflow, and current supported release line. Validation included docs inventory, lint, and full release-readiness.

## Original Proposal

The package-level docs are mostly coherent now, but the front door and operator
docs still lag the repo's actual runtime and release posture.

## Problem

The 2026-04-14 documentation audit found a small set of high-friction drifts:
- `README.md` under-represents the shipped package surface
- the root interactive example still teaches `initDefaultContext() + run(app)`
  while package docs prefer `startApp()`
- `CONTRIBUTING.md` still says `pnpm install` even though the repo is
  npm-workspace based
- `SECURITY.md` still has a stale supported-version table

None of these are architecture problems, but together they make the first
contact with the repo less truthful than the package docs and release tooling.

## Desired outcome

1. Update `README.md` so the package map reflects the current published surface.
2. Make the root quick start use the preferred Node-host bootstrap path.
3. Fix `CONTRIBUTING.md` to match the repo's actual install and validation
   workflow.
4. Refresh `SECURITY.md` so its supported-version language matches current repo
   truth.
5. Add a short "choose your lane" front-door path for CLI vs TUI vs MCP vs i18n.

## Why ASAP

- This is the highest-signal docs debt still visible to every new user.
- The repo now has strong release proof; the front door should stop lagging
  behind it.

## Hill

The first five minutes in the repo point users at the same package/runtime truth
that the implementation and release tooling already enforce.
