---
title: DX-030 Add boundary-aware pointer selection and copy
legend: DX
lane: up-next
priority: high
keywords:
  - dogfood
  - pointer
  - selection
  - clipboard
  - geometry
---

# DX-030 Add boundary-aware pointer selection and copy

DOGFOOD currently relies on terminal-native selection, which makes docs panes
feel brittle and dishonest for real reading and copying. A drag gesture should
not copy whatever terminal cells happen to be painted across the whole screen;
it should respect the owning component's geometry and reconstruct the intended
text from that component's semantic cells or paragraph model.

The framework-level requirement is larger than "let the terminal select text":
- selection should be opt-out default behavior for framed apps and docs-style
  panes
- hit-testing should stay bounded to the owning component or pane geometry
- copied text should be reconstructed from component-aware boundaries, not raw
  terminal rows
- wrapped prose, tables, and future rich surfaces need truthful extraction
  rules

Start by defining the contract:
- what selection metadata a surface or layout node can expose
- how retained layout geometry maps pointer drag regions to a component
- how copied output is reconstructed for prose blocks, tables, and mixed panes
- how the shell should arbitrate selection versus existing mouse routing

This is valuable enough to queue honestly, but it is too cross-cutting to hide
inside a narrow DOGFOOD patch.
