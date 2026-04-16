---
title: "DX-029 Document scopedNodeIO realpath and symlink semantics"
legend: DX
lane: inbox
---

# DX-029 Document scopedNodeIO realpath and symlink semantics

`scopedNodeIO()` now returns root-validated real paths and rejects symlink escapes through existing prefixes. Document that behavior in the Node guide/API surface so callers know why `resolvePath()` / `joinPath()` may return a realpath-normalized location instead of the lexical input path.
