# BEARING

## Where Are We Going?

Prepare a deliberate `4.1.0` release without pretending that every
follow-on must land first.

That means:

- treat [WF-004](./design/WF-004-shape-the-next-release.md) as the
  active release-shaping decision
- treat [WF-005](./design/WF-005-close-4-1-0-i18n-publish-surface-gap.md)
  and [WF-006](./design/WF-006-cut-clean-4-1-0-release-boundary.md) as
  the closing release-blocker cycles
- treat the cycle-shaped `4.1.0` backlog as closed; remaining work is
  release execution and the normal gauntlet
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

## What Feels Wrong?

- the remaining `4.1.0` work is now operational release execution, not
  another cycle-shaped design question
- `RE-007` and other follow-ons still need to stay outside the `4.1.0`
  release boundary
- `PLAN.md`, legends, and backlog placement had drifted from what had
  actually landed.
- some older backlog files are historical lineage, not live queue, but
  were still reading like current work
