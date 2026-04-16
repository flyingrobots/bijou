---
report_id: "AUD-2026-04-14-DQ-V01"
title: "Differential Documentation Audit: README and Operator Surfaces"
status: "Final"
audit:
  date_started: 2026-04-14
  date_completed: 2026-04-14
  type: "Differential"
  scope: "README.md, GUIDE.md, docs/README.md, CONTRIBUTING.md, SECURITY.md, package READMEs and GUIDEs"
  compliance_frameworks: []
target:
  repository: "github.com/flyingrobots/bijou"
  branch: "release/v5.0.0"
  commit_hash: "73160b9"
  language_stack: ["TypeScript 5.9.3", "Node.js >=18", "Vitest 4.0.18", "npm workspaces"]
  environment: "Local workspace with docs inventory and release-readiness evidence"
methodology:
  automated_tools: ["npm run docs:inventory", "npm run release:readiness", "rg"]
  manual_review_hours: 3
  false_positive_rate: "Low (<10%)"
summary:
  total_findings: 7
  severity_count:
    critical: 0
    high: 2
    medium: 4
    low: 1
  remediation_status: "Pending"
related_reports:
  previous_audit: "docs/audit/2026-04-11_documentation-quality.md"
  tracking_ticket: "DX-027"
---

# Documentation Quality Audit

This pass focuses on accuracy, completeness, and onboarding flow. The documentation structure is still a strength: `docs/README.md`, DOGFOOD, the design-system docs, and the release docs make the repo navigable without filesystem wandering. The biggest remaining problems are front-door completeness and onboarding consistency, not a total breakdown of the docs system.

## 1. Accuracy & Effectiveness Assessment

### 1.1. Core Mismatch

The most critical mismatch in the root `README.md` is the incomplete package map. The `Packages` table in `README.md:105-112` lists only four packages, but the repo also ships and documents additional public surfaces such as `@flyingrobots/bijou-mcp` (`docs/MCP.md`), `@flyingrobots/bijou-i18n-tools`, `@flyingrobots/bijou-i18n-tools-node`, `@flyingrobots/bijou-i18n-tools-xlsx`, `@flyingrobots/bijou-tui-app`, and `create-bijou-tui-app` (confirmed by `package.json`, `release:preflight`, and the package READMEs). That makes the README inaccurate as a package-selection guide.

### 1.2. Audience & Goal Alignment

**Primary audience:** TypeScript engineers deciding whether to use Bijou for a CLI, a full-screen TUI, an MCP rendering server, or internal localization/doc tooling.

**Does the documentation answer the top 3 audience questions?**

1. **"How do I start?"** Partially. The package guides answer this well, but the root front door still teaches a lower-level interactive bootstrap than the preferred current API.
2. **"Which package should I choose?"** Partially. `GUIDE.md` helps, but the root README package table under-represents the shipped surface area, especially MCP and the i18n tools.
3. **"How do I go deeper after hello-world?"** Yes. DOGFOOD, the documentation map, the design-system docs, and release guides are all strong.

### 1.3. Time-to-Value (TTV) Barrier

The biggest onboarding bottleneck is path fragmentation across the front door and supporting docs:

- the root README teaches `initDefaultContext()` + `run(app)` for interactive usage (`README.md:72-95`)
- package docs prefer `startApp()` (`packages/bijou-node/README.md:19-35`, `packages/bijou-tui/GUIDE.md:21-41`)
- contributor setup still says `pnpm install` even though the repo’s scripts, lockfile, and release flow are npm-based (`CONTRIBUTING.md:8-12`, `package.json:9-41`, `package-lock.json`)

That means a new developer does not see one canonical "clone the repo and get to a first frame" story.

## 2. Required Updates & Completeness Check

### 2.1. README.md Priority Fixes

- Expand the root `Packages` table so it covers the real shipped surface, especially `@flyingrobots/bijou-mcp`, the i18n tooling packages, `@flyingrobots/bijou-tui-app`, and `create-bijou-tui-app`.
- Replace the root interactive quick start with the preferred `startApp()`-based path, and explicitly explain when someone should still drop down to `run(app, { ctx })`.
- Add a short "Choose Your Lane" selector directly in the root README for CLI vs TUI vs MCP vs i18n so the first click lands on the right package guide.

### 2.2. Missing Standard Documentation

At least two standard repository documentation surfaces are still missing for a library/project of this type:

1. **`SUPPORT.md`**: There is a `SECURITY.md`, but there is no canonical support/escalation surface for normal user questions, bug-routing, and maintainer expectations.
2. **Generated API reference coverage**: There is no first-class repo-level API reference surface (TypeDoc or equivalent) for exported functions/types across the published packages. For a multi-package TypeScript library, that is a standard expectation.

### 2.3. Supplementary Documentation (Docs)

The most under-documented complex area is the `createFramedApp()` extension model. The implementation is spread across `packages/bijou-tui/src/app-frame.ts` and `packages/bijou-tui/src/app-frame-render.ts`, while the user-facing explanation is split across package docs and strategy notes. The repo needs one dedicated guide that explains shell-owned layers, page routing, notifications/settings ownership, and pane/layout behavior in one place.

## 3. Final Action Plan

### 3.1. Recommendation Type

**A. Recommend incremental updates to the existing README and documentation.**

The documentation system is structurally strong. This is not a rewrite problem. It is a front-door accuracy and onboarding consistency problem.

### 3.2. Deliverable (Prompt Generation)

Update the root README so it reflects the full shipped package surface and the current preferred bootstrap path, correct supporting-doc drift in `CONTRIBUTING.md` and `SECURITY.md`, create `SUPPORT.md`, and add a dedicated framed-app extension guide plus an API reference plan/surface.

### 3.3. Mitigation Prompt

```text
Apply an incremental documentation repair pass across Bijou's front door and operator docs.

1. Update `README.md`:
   - replace the interactive quick start with a `startApp()` example
   - expand the package table to include MCP, i18n tooling, `bijou-tui-app`, and `create-bijou-tui-app`
   - add a short "Choose Your Lane" section pointing users to CLI, TUI, MCP, and i18n entrypoints

2. Update supporting docs:
   - change `CONTRIBUTING.md` from `pnpm install` to the repo's actual npm workflow
   - refresh `SECURITY.md` so the supported-version table matches the current release reality instead of stopping at `4.1.x`

3. Create missing standard docs:
   - add `SUPPORT.md` with issue-routing, discussion/support expectations, and maintainer contact guidance
   - add an API-reference plan or generated surface (for example `docs/api/README.md` or TypeDoc output instructions) for the exported package APIs

4. Add one new advanced guide:
   - create a dedicated `createFramedApp()` extension guide explaining shell-owned notifications/settings, page routing, pane behavior, and when to use page commands vs shell commands

Keep the existing documentation structure intact. This is a precision update, not a rewrite.
```
