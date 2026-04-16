# DX-016 — Error Surface for Crash Post-Mortems

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Idea

When a TUI app crashes during `update()` or `view()`, the `runtime.ts` currently catches the error, writes the stack trace to stderr, and exits. If the app is in alt-screen mode, this stack trace is often lost or obscured by the terminal's screen restoration.

Implement a dedicated "Error Surface" that is rendered using Bijou components *before* the alt-screen is exited. This surface should display:
- The error message and stack trace.
- The last stable model snapshot (if serializable).
- A prompt to "Press Enter to exit."

## Why

1. **Visibility**: Keeps critical crash data on-screen for the developer to inspect before the process dies.
2. **Professionalism**: Moves the app from a "noisy CLI crash" to a "structured post-mortem."
3. **Diagnostic Power**: Capturing the model state at the point of failure is an industrial-strength debugging aid.

## Effort

Medium — requires a special "Crash Mode" in the run loop that bypasses the normal TEA update and renders a static diagnostic surface.
