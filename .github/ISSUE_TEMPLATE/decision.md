---
name: Decision
about: "Use when the facts are known and the open item is which option, and who says so."
labels: lane:inbox, type:spike
---

# Decision

```yaml
.dag: issue-dag/2
.id: flyingrobots/bijou#NEW
.kind: task
.type: decision
.blocked_by: []
.size_hours: 2
```

```text
You are the analyst for this issue. Read all sections of this issue.
Examine each option in section 2b. Cite the evidence for each consequence.
Do not make the decision yourself unless section 2d names you.
Record the decision and the rejected options where the next reader will find them.
Write the location of that record in a comment on this issue.
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

## 2. The choice
A question with named options.
## 2b. Options and consequences
One line each.
## 2c. Rests on
Evidence, cited by something immutable, or a person, named.
## 2d. Who decides, and by when
## 2e. What is blocked until then
## 2f. Reversible

## 3. Prerequisites
- [ ]

## 4. Scope
In:
Out:

## 5. Why now
## 6. Risks
## 7. Definition of Done
Recorded where the next reader will find it, which is usually not only this card.
## 8. Stakeholders
## 9. Related Issues
