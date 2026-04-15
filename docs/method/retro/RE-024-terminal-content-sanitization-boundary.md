---
title: "RE-024 — Terminal Content Sanitization Boundary"
legend: RE
lane: retro
---

# RE-024 — Terminal Content Sanitization Boundary

Completed on `release/v5.0.0`. Bijou now ships a first-class terminal text
sanitization seam through `sanitizeTerminalText()` in
`packages/bijou/src/core/text/grapheme.ts`, re-exports that helper publicly,
and covers destructive escape payloads in `grapheme.test.ts`. The later
surface-native hardening pass also routes `badge()`, `createTextSurface()`, and
`hyperlink()` through that boundary so untrusted text no longer slips past the
plain-text path by default.

## Original Proposal

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

## Problem

Bijou has strong low-level ANSI handling, but it does not yet define a
clear safety boundary for untrusted or user-provided content. The
2026-04-11 ship-readiness audit flagged this as both a terminal
injection risk and a correctness risk for render/diff bookkeeping when
destructive escape sequences slip through ordinary content paths.

Right now the repo has helpers for stripping ANSI, but not a clear
runtime contract for when content must be sanitized or how trusted vs
untrusted strings should be modeled.

## Desired outcome

1. Define where content sanitization belongs in the runtime/render path.
2. Decide whether the answer is a sanitize stage, a `SafeString`
   component, explicit trusted/untrusted content types, or a narrower
   boundary helper.
3. Add regression coverage for destructive escape-sequence payloads.

## Effort

Medium — contract design, implementation, and tests.
