---
name: Feature
about: "Use when the end state is known and only the work remains."
labels: lane:inbox, type:enhancement
---

```yaml
.dag: issue-dag/2
.id: flyingrobots/bijou#NEW
.kind: task
.type: feature
.blocked_by: []
.size_hours: 2
```

<!--
issue-dag/2 frontmatter (Taskalisk): after GitHub assigns the number, replace NEW in `.id` with it; a block
whose `.id` does not name the issue fails. Every reference is owner/repo#N, never a bare #N. List each
prerequisite issue in `.blocked_by` and explain it under Prerequisites. Above 8 hours is probably two tasks.
Write "none" or "not applicable, because X" instead of padding a section.
-->

## 1. Background Context

## 2. Problem Description
## 2b. Proposed Solution
## 2c. Alternatives considered and rejected
One line each.
## 2d. Acceptance Criteria
## 2e. Test Plan
Golden:
Edges:
Known failure modes:
Fuzz and stress:

## 3. Prerequisites
- [ ]

## 4. Scope
In:
Out:

## 5. Why now
## 6. Risks
## 7. Definition of Done
## 8. Stakeholders
## 9. Related Issues
