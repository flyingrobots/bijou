---
name: Task
about: "Use for a card that does not fit a typed template. This is the flat nine-section card."
labels: lane:inbox
---

```yaml
.dag: issue-dag/2
.id: flyingrobots/bijou#NEW
.kind: task
.type: task
.blocked_by: []
.size_hours: 2
```

# Task

```text
You are the engineer for this issue. Read all sections of this issue.
Write tests from section 8 first. Make sure that they fail before you write the code.
Do the work in section 3. Make sure that all tests pass.
Make sure that each item in section 6 (Acceptance Criteria) is true.
Do not change items that section 5 puts out of scope.
Use the sealed Docker test runner for all tests. Do not use --no-verify.
Read AGENTS.md and the Bijou code standards before you change code.
Open a draft pull request. Link this issue. Write progress comments on the pull request.
Make the pull request ready only when all items in the Definition of Done are true and CI passes.
```

<!--
issue-dag/2 frontmatter (Taskalisk): after GitHub assigns the number, replace NEW in `.id` with it; a block
whose `.id` does not name the issue fails. Every reference is owner/repo#N, never a bare #N. List each
prerequisite issue in `.blocked_by` and explain it under Prerequisites. Above 8 hours is probably two tasks.
Write "none" or "not applicable, because X" instead of padding a section.
-->

## 1. Background Context
What this concerns.

## 2. Problem Description
What is broken or missing.

## 3. Proposed Solution
How to fix it.

## 4. Prerequisites
Before we start, these must be true.
- [ ]

## 5. Scope
In:
Out:

## 6. Acceptance Criteria
What must be true before this is considered finished.

## 7. Definition of Done
How to know when to stop.

## 8. Test Plan
Golden:
Edges:
Known failure modes:
Fuzz and stress:

## 9. Stakeholders
Named people or teams who care about this issue, and why.
