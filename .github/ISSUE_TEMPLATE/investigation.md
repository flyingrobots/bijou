---
name: Investigation
about: "Use when a system matters but we do not yet know what questions to ask about it."
labels: lane:inbox, type:spike
---

# Investigation

```yaml
.dag: issue-dag/2
.id: flyingrobots/bijou#NEW
.kind: task
.type: investigation
.blocked_by: []
.size_hours: 2
```

```text
You are the investigator for this issue. Read all sections of this issue.
Examine the area in section 2 at the locations in section 2b.
Stop when the time box in section 2c ends.
Record each finding in section 2d. Write one line for each finding.
File one typed issue for each finding. Write its number next to the finding.
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
The system, and why we are taking it on.

## 2. What we do not understand
The area, not a question. If you have one question, file Research instead.
## 2b. Where to look
Surfaces, repositories, dashboards, people.
## 2c. Time box
## 2d. Findings
Empty at filing. One line per finding, each with the card it became.

## 3. Prerequisites
- [ ]

## 4. Scope
In:
Out:

## 5. Why now
## 6. Risks
## 7. Definition of Done
The map exists and every finding has a typed card.
## 8. Stakeholders
## 9. Related Issues
