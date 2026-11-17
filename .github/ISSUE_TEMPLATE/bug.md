---
name: Bug
about: "Use when there is a symptom and no known cause. No Proposed Solution at filing; Diagnosis is required before fix work starts."
labels: lane:inbox, type:bug
---

# Bug

```yaml
.dag: issue-dag/2
.id: flyingrobots/bijou#NEW
.kind: task
.type: bug
.blocked_by: []
.size_hours: 2
```

```text
You are the engineer for this issue. Read all sections of this issue.
Do not start a fix before section 2f (Diagnosis) is complete.
Reproduce the symptom in section 2c. Record the cause in section 2f.
Write a regression test. Make sure that it fails before the fix.
Fix the cause. Make sure that the test passes after the fix.
Do not change items that section 4 puts out of scope.
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

## 2. Observed
What happens now.
## 2b. Expected
What should happen instead.
## 2c. Reproduction
Steps, or: not reproduced, observed in production at <time> from <source>.
## 2d. Blast radius
Who is affected, as a population.
How many, with the query that produced the number, marked observed or estimated.
Since when.
Downstream: what consumed the wrong value.
## 2e. Hypothesis
What I think is happening, and the observation that would kill it.
## 2f. Diagnosis
Empty at filing. Required before any fix work starts.

## 3. Prerequisites
- [ ]

## 4. Scope
In:
Out:

## 5. Why now
## 6. Risks
## 7. Definition of Done
A regression test that fails before the fix and passes after it.
## 8. Stakeholders
## 9. Related Issues
