---
title: "DX-026 — Mode-Lowering Linter"
legend: DX
lane: cool-ideas
---

# DX-026 — Mode-Lowering Linter

A linter or diagnostic helper that checks whether a component's pipe and accessible lowerings preserve the semantic truth of the richer render path.

Why:
- mode-lowering regressions are easy to miss until someone reads pipe or accessible output directly
- Bijou now has stronger emphasis on truthful lowerings across modes
- a first-party linter would make that doctrine enforceable and reviewable

Possible scope:
- verify that key entities, edges, counts, labels, or state survive into lowerings
- warn when rich output collapses several semantic objects into one line or phrase
- integrate with stories, docs previews, or tests
- allow custom assertions for component-specific truth invariants

This is about semantic fidelity across modes, not pixel-perfect textual matching.
