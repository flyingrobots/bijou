# What's New in Bijou 7.2.0

Bijou 7.2.0 is a stabilization release for the V7 demo and documentation
surface. It keeps the public Runtime Graph direction intentionally narrow while
tightening framework input behavior, DOGFOOD readability, Blocks documentation,
release evidence, and dependency review.

The public tag is created only after the release-prep branch merges and
final-main validation passes. This document is the versioned release overview
DOGFOOD and the repository front door use for 7.2.0.

## Framework Input Stabilization

The TUI framework now has better coverage for page-scoped input fallthrough and
scripted mouse sequences. Workspace mouse movement, release, wheel, and
non-left press events can be replayed through deterministic driver helpers, and
the public TUI package exposes the frame helper APIs needed by application
code.

This is the practical fix for release-demo workflows that need reliable mouse
inspection without relying on terminal-specific manual behavior.

## DOGFOOD Readability And Release Story

DOGFOOD received another pass over the surfaces that made the 7.1 release-video
rehearsal hard to inspect:

- locale fallback copy now distinguishes missing translations from intentional
  English source text
- light-theme screenshots and fixture coverage keep color contrast and shell
  state readable
- in-app release-story pages now point reviewers at the V7.2 evidence packet
  rather than asking them to infer the release state from scattered docs

The goal is not a new product surface. The goal is that the existing proof
surface tells the truth when somebody records or reviews it.

## Blocks Documentation

The Blocks app-binding guide now includes copyable snippets and deterministic
fixtures for the current binding shape. The documentation remains scoped to
the V7 proof path, but it gives readers enough structure to understand how
bindings, actions, and DOGFOOD examples relate before the larger V8 work starts.

## Theme Variant Coverage

First-party dark and light theme variants have explicit coverage in the release
packet. The release keeps theme behavior focused on readability and replay
evidence rather than opening a broader design-system expansion.

## Release Evidence

The release gate now carries a versioned evidence packet alongside the package
metadata bump. That packet records trackers, landed PRs, replay commands,
security audit scope, registry verification, release-readiness posture, and
residual risk.

Maintainers should treat the release evidence packet as the authoritative 7.2
release-prep checklist until the final tag is created from the merged
`origin/main` release commit.

## V8 Posture

Bijou 7.2.0 intentionally stops short of the next Runtime Graph product. The
forward path remains:

```text
GraphQL Blocks -> Bijou Blocks IR -> Geordi render targets -> TUI | Browser | Native UI
```

That work belongs to V8 and later. V7.2 makes the current release surface clean
enough to move on without carrying avoidable release debt forward.
