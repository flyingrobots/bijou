# BEARING

## Where Are We Going?

Prepare a deliberate `4.1.0` release without pretending that every
follow-on must land first.

That means:

- treat [WF-004](./design/WF-004-shape-the-next-release.md) as the
  active release-shaping decision
- treat [`docs/BACKLOG/v4.1.0/`](./BACKLOG/v4.1.0/README.md) as the
  queue for remaining cycle-shaped `4.1.0` blockers
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

## What Feels Wrong?

- `CHANGELOG.md` still needs its final `4.1.0` cut from the real
  `v4.0.0..HEAD` boundary
- the pre-release blockers need to stay visibly separate from ordinary
  follow-on backlog so `4.1.0` does not drift again
- `PLAN.md`, legends, and backlog placement had drifted from what had
  actually landed.
- some older backlog files are historical lineage, not live queue, but
  were still reading like current work
