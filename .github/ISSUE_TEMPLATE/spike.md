---
name: Spike
about: "Use to test an approach with throwaway code inside a time box."
labels: lane:inbox, type:spike
---

```yaml
.dag: issue-dag/2
.id: flyingrobots/bijou#NEW
.kind: task
.type: spike
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

## 2. The approach being tested
## 2b. What would make us adopt it
## 2c. What would make us reject it
## 2d. What gets deleted afterwards
The code this produces is throwaway. Say so here.
## 2e. Time box
## 2f. Findings

## 3. Prerequisites
- [ ]

## 4. Scope
In:
Out:

## 5. Why now
## 6. Risks
## 7. Definition of Done
Adopt or reject, recorded, and the throwaway deleted.
## 8. Stakeholders
## 9. Related Issues
