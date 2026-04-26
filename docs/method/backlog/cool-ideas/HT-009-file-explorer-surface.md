---
title: "HT-009 — File Explorer Surface"
legend: HT
lane: cool-ideas
---

# HT-009 — File Explorer Surface

A first-party file explorer surface for walking directories, previewing file
metadata, and selecting paths inside framed Bijou apps.

Why:
- filesystem-oriented apps currently have to compose tree, list, pager, and
  prompt primitives by hand
- the design-system already points at interactive filesystem browsing as a
  recurring pattern, but there is no canonical surface for it
- a first-party explorer would make path navigation, selection, and parent or
  child movement more predictable for humans and agents

Possible scope:
- render directories and files with clear visual distinction, current path
  context, and explicit parent navigation
- support keyboard-owned traversal, split preview layouts, and actions that do
  not hide control ownership
- expose selection through honest commands/events and lower cleanly to
  plain-text path lists when rich interaction is unavailable
- pair with `scopedNodeIO()`, `filePicker()`, and `filePickerSurface()` so the
  browsing model matches Bijou's filesystem boundary semantics

This should stay a canonical explorer surface idea, not an implicit commitment
to build a full terminal file manager.
