---
title: "DL-011 — Theme Contrast Doctor"
legend: DL
lane: cool-ideas
---

# DL-011 — Theme Contrast Doctor

A theme analysis tool that checks Bijou themes against token house rules, contrast expectations, and suspicious token reuse.

Why:
- the repo now has explicit token doctrine, but no tool that verifies whether a theme actually follows it
- poor contrast and token misuse can survive until manual visual review
- a first-party doctor would help both framework authors and third-party theme authors

Possible scope:
- flag weak foreground/background contrast on first-party token pairs
- report missing token families or suspicious fallbacks
- identify overused semantic tokens or likely surface/border misuse
- warn about mode-lowering risks for pipe or accessible output

This should make the token doctrine actionable rather than purely descriptive.
