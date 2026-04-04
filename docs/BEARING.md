# BEARING

## Where Are We Going?

Prepare a deliberate `4.1.0` release without pretending that DOGFOOD is
already a full terminal docs site.

That means:

- treat [WF-004](./design/WF-004-shape-the-next-release.md) as the
  active release-shaping decision
- treat [WF-005](./design/WF-005-close-4-1-0-i18n-publish-surface-gap.md)
  and [WF-006](./design/WF-006-cut-clean-4-1-0-release-boundary.md) as
  the closing release-blocker cycles
- treat [DF-021](./design/DF-021-shape-dogfood-as-terminal-docs-system.md)
  as the active release-shaping follow-on that reopens cycle-shaped
  `4.1.0` blockers around DOGFOOD's scope
- treat [DF-022](./design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md)
  as the cycle that gives DOGFOOD a visible docs-site shell and prose
  reader
- treat [DF-023](./design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md)
  as the cycle that publishes repo/package/release guidance into that
  shell
- treat [DF-024](./design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md)
  as the cycle that publishes doctrine and architecture guidance into
  that shell
- treat [DF-025](./design/DF-025-make-dogfood-the-only-human-facing-docs-surface.md)
  as the cycle that makes DOGFOOD, not `examples/`, the only
  human-facing docs front door for `4.1.0`
- clear the active `v4.1.0` blocker lane in
  [`docs/BACKLOG/v4.1.0/`](./BACKLOG/v4.1.0/README.md) before release
  execution begins
- ship the runtime-engine story through
  [RE-006](./design/RE-006-formalize-component-layout-and-interaction-contracts.md)
  in `4.1.0`
- keep
  [RE-007](./BACKLOG/up-next/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
  as follow-on work after the release
- keep workflow truth in METHOD-style backlog lanes and signposts
- use DOGFOOD and design-language work as proving surfaces, not as
  excuses to postpone runtime clarity

## What Just Shipped?

The latest merged runtime- and release-shaping slices are:

- [RE-006](./design/RE-006-formalize-component-layout-and-interaction-contracts.md)
- [DX-001](./design/DX-001-type-framed-app-messages-and-updates-end-to-end.md)
- [DX-002](./design/DX-002-reconcile-cmd-typing-with-cleanup-and-effect-patterns.md)
- [WF-004](./design/WF-004-shape-the-next-release.md)
- [WF-005](./design/WF-005-close-4-1-0-i18n-publish-surface-gap.md)
- [WF-006](./design/WF-006-cut-clean-4-1-0-release-boundary.md)
- [DF-022](./design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md)
- [DF-023](./design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md)
- [DF-024](./design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md)

## What Feels Wrong?

- DOGFOOD now has the repo/package/release/philosophy corpus inside the
  app, but the repo still has not finished demoting `examples/` or
  moving release smoke onto DOGFOOD
- the repo still exposes too much example-first language for a release
  that claims DOGFOOD is the docs product
- the remaining `4.1.0` work is still not only release execution; the
  open blockers are now docs-surface and smoke-contract cycles rather
  than shell shape
- `RE-007` and other follow-ons still need to stay outside the `4.1.0`
  release boundary
- `PLAN.md`, legends, and backlog placement had drifted from what had
  actually landed.
- some older backlog files are historical lineage, not live queue, but
  were still reading like current work
