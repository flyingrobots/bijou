# Documentation & README Audit — 2026-04-05

_Comprehensive audit of bijou's documentation surfaces, measuring
accuracy against the codebase, completeness against community
standards, and effectiveness for new developer onboarding._

---

## 1. Accuracy & Effectiveness

### 1.1. Core Mismatch

Five package READMEs contain section headings that say "Package Role
in v4.0.0" when the current shipped version is 4.1.0. The content
beneath the headings is accurate for 4.1.0 — only the headings are
stale.

Files affected:
- `packages/bijou/README.md:7`
- `packages/bijou-tui/README.md:7`
- `packages/bijou-node/README.md:7`
- `packages/bijou-tui-app/README.md:5`
- `packages/create-bijou-tui-app/README.md:5`

This is cosmetic but sends mixed signals about whether the docs are
current.

### 1.2. Audience & Goal Alignment

**Primary audience:** Developers building terminal applications in
TypeScript/Node.js — both new users evaluating bijou and experienced
users extending it.

**Top 3 questions and coverage:**

| Question | Answered? | Where |
|----------|-----------|-------|
| How do I get a working app in 5 minutes? | Yes | Root README quick start + scaffolder |
| Which component should I use for X? | Yes, excellently | `docs/design-system/component-families.md` + DOGFOOD |
| How do I contribute? | **No** | No CONTRIBUTING.md, no PR template, no CODE_OF_CONDUCT |

The first two are handled better than most open-source projects.
The third is completely missing.

### 1.3. Time-to-Value Barrier

The interactive runtime example in the root README (lines ~120-150)
does not show the mandatory `initDefaultContext()` call. A developer
copying that example into a new file will get:

```
Error: No default BijouContext has been set.
```

The scaffolded path (`npm create bijou-tui-app@latest`) handles
this automatically, but anyone integrating into an existing project
hits this wall. The error message doesn't explain how to fix it.

**Backlog:** [DX-009](../method/graveyard/legacy-backlog/inbox/DX-009-context-auto-init-and-error-messages.md)

---

## 2. Required Updates & Completeness

### 2.1. README.md Priority Fixes

1. **Fix "v4.0.0" headings across 5 package READMEs.** Change to
   "Package Role" (unversioned) or "Package Role in v4" since the
   role hasn't changed between 4.0.0 and 4.1.0.

2. **Add `initDefaultContext()` to the interactive runtime example**
   in the root README. The example should be copy-pasteable without
   hidden prerequisites.

3. **Add a "Contributing" section** to the root README that either
   provides inline guidance or links to a `CONTRIBUTING.md`.

### 2.2. Missing Standard Documentation

The following community-standard files are **missing entirely**:

| File | Purpose | Impact |
|------|---------|--------|
| `CONTRIBUTING.md` | Contribution workflow, branch strategy, PR expectations | Blocks first-time contributors |
| `CODE_OF_CONDUCT.md` | Community values, harassment policy, enforcement | Standard for open-source, signals safety |
| `SECURITY.md` | Vulnerability reporting policy | Required for responsible disclosure |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Structured bug reports | Reduces triage friction |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Structured feature requests | Reduces triage friction |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR checklist | Ensures quality contributions |

These are **baseline expectations** for any public open-source
project. Their absence doesn't reflect the actual quality of the
repo — the engineering culture is clearly strong — but it does
create friction for outsiders.

### 2.3. Undocumented Complex Area

The **render pipeline** (`Layout → Paint → PostProcess → Diff →
Output`) is the most architecturally important subsystem that has
zero developer-facing documentation. It is configurable via
`RunOptions.configurePipeline` but there is no guide explaining:

- What each stage does
- How to write custom middleware
- What `RenderState` fields are available
- How stages interact with each other
- Limitations (sync-only, no stage wrapping, no timing hooks)

The perf-gradient demo proved this gap — we could not instrument the
pipeline from outside because the documentation didn't explain the
boundaries.

**Backlog:** [DX-008](../method/graveyard/legacy-backlog/inbox/DX-008-render-pipeline-guide.md)

---

## 3. Final Action Plan

### 3.1. Recommendation: A (Incremental Updates)

The documentation foundation is strong. The governance model
(`docs/README.md` as audit entrypoint) is excellent. The design-
system docs are better than most commercial projects. This is not a
rewrite situation — it's a gap-filling exercise.

### 3.2. Specific Actions

**Immediate (this session):**
1. Fix "v4.0.0" headings in 5 package READMEs
2. Create CONTRIBUTING.md
3. Create CODE_OF_CONDUCT.md
4. Create SECURITY.md
5. Create GitHub issue and PR templates
6. Fix the root README interactive example to include context init

**Backlog (future cycles):**
- [DX-008](../method/graveyard/legacy-backlog/inbox/DX-008-render-pipeline-guide.md) —
  render pipeline guide
- [DX-009](../method/graveyard/legacy-backlog/inbox/DX-009-context-auto-init-and-error-messages.md) —
  context auto-init and error messages

---

## Documentation Scorecard

| Metric | Score (1-10) |
|--------|-------------|
| Completeness (all packages documented) | 10 |
| Accuracy (content matches code) | 9 |
| Clarity for new developers | 8 |
| Link validity | 10 |
| Current-truth governance | 10 |
| Community standards | 4 |
| **Overall** | **7.5** |

---

## Personal Note

The documentation governance in this repo is genuinely impressive.
`docs/README.md` explicitly saying "do not audit by walking the
filesystem — start here" is a pattern I wish more projects adopted.
The design-system-first approach (teaching *when* to use a
component, not just *how*) is best-in-class.

The gap is entirely in community surface: CONTRIBUTING, CODE OF
CONDUCT, SECURITY, and GitHub templates. These are table stakes for
open source and their absence is surprising given how polished
everything else is. Filing them is an hour of work that permanently
removes a class of contributor friction.
