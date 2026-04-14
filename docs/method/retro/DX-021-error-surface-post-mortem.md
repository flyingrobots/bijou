---
title: DX-021 — Error Surface for Crash Post-Mortems
lane: retro
legend: DX
---

# DX-021 — Error Surface for Crash Post-Mortems

## Disposition

Implemented on `release/v5.0.0`. The interactive TUI runtime now switches into
a crash surface when `update()` or `view()` fails, renders the error, stack,
phase, and last stable model snapshot inside the alt screen, and waits for
Enter before tearing the terminal down and rethrowing the failure. That turns a
lost alt-screen crash into a readable post-mortem without changing the raw
runtime contract.

## Original Proposal

Legend: [DX — Developer Experience](../legends/DX-developer-experience.md)

## Idea

When a TUI app crashes during `update()` or `view()`, the `runtime.ts`
currently catches the error, writes the stack trace to stderr, and exits. If
the app is in alt-screen mode, this stack trace is often lost or obscured by
the terminal's screen restoration.

Implement a dedicated "Error Surface" that is rendered using Bijou components
_before_ the alt-screen is exited. This surface should display:

- The error message and stack trace.
- The last stable model snapshot (if serializable).
- A prompt to "Press Enter to exit."
