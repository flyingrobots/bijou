---
name: Research
about: "Use when there is one answerable question and a decision waits on the answer."
labels: lane:inbox, type:spike
---

# Research

```yaml
.dag: issue-dag/2
.id: flyingrobots/bijou#NEW
.kind: task
.type: research
.blocked_by: []
.size_hours: 2
```

```text
You are the researcher for this issue. Read all sections of this issue.
Answer only the question in section 2.
Use the method in section 2c. Obey the limits in section 2d.
Record the value, the command, and the time in section 2f.
If you cannot answer the question, record why in section 2f.
Do not change code.
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

## 2. The Question
One sentence, answerable.
## 2b. What decision waits on it
If nothing does, do not file this.
## 2c. What would settle it
The observation, the method, and where the data lives.
## 2d. Aperture
What this cannot see, so a negative result is not read as a positive.
## 2e. Possible answers and what each implies
Written before looking.
## 2f. Evidence
Empty at filing. The value, the command that produced it, the timestamp.

## 3. Prerequisites
- [ ]

## 4. Scope
In:
Out:

## 5. Why now
## 6. Risks
## 7. Definition of Done
An answer under Evidence, or a declared unanswerable-because.
## 8. Stakeholders
## 9. Related Issues
