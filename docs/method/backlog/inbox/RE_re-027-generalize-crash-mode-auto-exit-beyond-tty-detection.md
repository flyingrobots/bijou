---
title: "RE-027 Generalize crash-mode auto-exit beyond TTY detection"
legend: RE
lane: inbox
---

# RE-027 Generalize crash-mode auto-exit beyond TTY detection

The current crash-mode fix auto-exits when `stdinIsTTY` is false. Follow up by making crash-mode exit policy depend on actual input availability or host capabilities, so worker/IPC transports can explicitly opt in to crash-surface interactivity without being tied to process TTY heuristics.
