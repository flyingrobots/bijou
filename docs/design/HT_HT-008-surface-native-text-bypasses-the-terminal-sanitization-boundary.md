---
title: "HT-008 — Surface-native text bypasses the terminal sanitization boundary"
legend: "HT"
cycle: "HT_HT-008-surface-native-text-bypasses-the-terminal-sanitization-boundary"
source_backlog: "docs/method/backlog/asap/HT-008-surface-native-text-bypasses-the-terminal-sanitization-boundary.md"
---

# HT-008 — Surface-native text bypasses the terminal sanitization boundary

Source backlog item: `docs/method/backlog/asap/HT-008-surface-native-text-bypasses-the-terminal-sanitization-boundary.md`
Legend: HT

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

These labels are abstract roles. In this design, `user` means the served
perspective, like in a user story, not a literal named person or
specific agent instance.

## Hill

TBD

## Playback Questions

### Human

- [ ] TBD

### Agent

- [ ] TBD

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: TBD
- Non-visual or alternate-reading expectations: TBD

## Localization and Directionality

- Locale / wording / formatting assumptions: TBD
- Logical direction / layout assumptions: TBD

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: TBD
- What must be attributable, evidenced, or governed: TBD

## Non-goals

- [ ] TBD

## Backlog Context

The 2026-04-14 audit pass found that Bijou's terminal-safety story is still
split across several public text entry points.

## Problem

The plain-text bridges sanitize control sequences before they reach terminal
output, but several public surface-native helpers still accept raw strings and
write them directly into cells or OSC sequences.

Current evidence:
- `packages/bijou/src/core/components/badge.ts`
- `packages/bijou/src/core/components/surface-text.ts`
- `packages/bijou/src/core/components/hyperlink.ts`

That means an app can appear "safe" because some paths sanitize terminal text
while other paths still allow destructive control bytes to survive into
interactive/static output.

## Desired outcome

1. Define one shared trusted/untrusted text boundary for public text-bearing
   APIs.
2. Route `badge()`, surface-text helpers, `hyperlink()`, and transitive callers
   through that boundary.
3. Add regression coverage for CSI, OSC, DCS, BEL, and mixed escape payloads.
4. Document when callers should use plain text, trusted styled text, or
   explicit ANSI parsing.

## Why ASAP

- This is the single most important remaining ship-readiness risk from the
  2026-04-14 audit.
- The repo is otherwise release-green, which makes this a high-leverage hardening
  task instead of speculative cleanup.

## Hill

Every public text-bearing helper passes through one auditable terminal-safety
contract before it becomes cells or terminal control output.
