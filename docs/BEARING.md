# BEARING

## Where Are We Going?

Return to post-`4.1.0` engineering work without letting the repo keep
pretending the release is still ahead of us.

The runtime engine is back at the center of gravity.

That means:

- treat `4.1.0` as shipped truth, not as pending release intent
- run
  [RE-007](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
  as the live runtime-engine cycle
- use the framed shell as the proving surface for the next runtime
  slice, not as a reason to leave shell behavior half inside old branch
  structure
- keep
  [DF-020](./BACKLOG/up-next/DF-020-deepen-dogfood-story-depth-and-variant-quality.md)
  and
  [DL-009](./BACKLOG/up-next/DL-009-formalize-layout-and-viewport-rules.md)
  as immediate follow-ons behind `RE-007`
- keep workflow truth in METHOD-style backlog lanes and signposts
- keep DOGFOOD as the canonical human-facing docs surface and release
  smoke contract
- keep `examples/` secondary and reference-oriented
- leave `4.2.0` unshaped until there is enough real new material to
  justify another release-shaping cycle
- use DOGFOOD and design-language work as proving surfaces, not as the
  repo's center of gravity while runtime clarity still has unfinished
  spine work

## What Just Shipped?

The latest shipped release and shaping arc are:

- [`4.1.0`](./CHANGELOG.md)
- [WF-004](./design/WF-004-shape-the-next-release.md)
- [WF-005](./design/WF-005-close-4-1-0-i18n-publish-surface-gap.md)
- [WF-006](./design/WF-006-cut-clean-4-1-0-release-boundary.md)
- [DF-021](./design/DF-021-shape-dogfood-as-terminal-docs-system.md)
- [DF-022](./design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md)
- [DF-023](./design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md)
- [DF-024](./design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md)
- [DF-025](./design/DF-025-make-dogfood-the-only-human-facing-docs-surface.md)
- [DF-026](./design/DF-026-demote-examples-to-secondary-reference-status.md)
- [WF-003](./design/WF-003-replace-smoke-examples-with-smoke-dogfood.md)

The latest merged runtime slices still anchoring the product direction
are:

- [RE-006](./design/RE-006-formalize-component-layout-and-interaction-contracts.md)
- [DX-001](./design/DX-001-type-framed-app-messages-and-updates-end-to-end.md)
- [DX-002](./design/DX-002-reconcile-cmd-typing-with-cleanup-and-effect-patterns.md)

## What Feels Wrong?

- the runtime-engine story stops one slice short of the framed shell,
  which leaves the most visible architectural debt outside the new seams
- some internal reference tooling still carries example-first names even
  though the public posture is now DOGFOOD-first
- `RE-007` has started, but only its first shell/runtime seam is honest
  yet
- the `4.1.0` release workflow history is cosmetically messy even though
  the shipped registry state is correct
- `PLAN.md`, legends, and backlog placement had drifted from what had
  actually landed.
- some older backlog files are historical lineage, not live queue, but
  were still reading like current work
