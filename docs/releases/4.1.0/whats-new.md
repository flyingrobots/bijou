# What's New In Bijou v4.1.0

This is the long-form release overview for Bijou `v4.1.0`.

It is intentionally different from [`CHANGELOG.md`](../../CHANGELOG.md):
the changelog is the ledger, while this document explains the shape and
meaning of the release.

## Release Story

The short version is:

Bijou has moved from a surface-first terminal toolkit toward a more
coherent application platform.

The main themes are:

- the runtime now has a real engine model instead of shell folklore
- the framed shell is calmer, richer, and easier to inspect
- DOGFOOD is now a serious proving surface rather than a partial demo
- localization has a real substrate and tooling story
- design language and delivery doctrine are now explicit repo truth

If `v4.0.0` was the "pure v4 surface" release, `v4.1.0` is the
"runtime, shell, docs, and tooling grow up together" release.

## Runtime Engine: From Seams To Model

The biggest architectural change since `v4.0.0` is the new runtime
engine direction captured in:

- [RE-001](../../design/RE-001-define-runtime-engine-architecture.md)
- [RE-002](../../design/RE-002-promote-first-class-state-machine-and-view-stack.md)
- [RE-003](../../design/RE-003-retain-layout-trees-and-layout-invalidation.md)
- [RE-004](../../design/RE-004-route-input-through-layouts-and-layer-bubbling.md)
- [RE-005](../../design/RE-005-buffer-commands-and-effects-separately.md)
- [RE-006](../../design/RE-006-formalize-component-layout-and-interaction-contracts.md)

In practical terms, the runtime now exposes a clearer model for:

- state machines versus view stacks
- retained layouts and invalidation causes
- layout-driven input routing
- distinct command and effect buffers
- component-owned interaction contracts

This matters because builders can now explain where state lives, where
views live, how geometry is retained, and how input is routed without
relying on branch order inside the shell. Agents benefit even more:
runtime ownership is increasingly inspectable instead of implicit.

The remaining follow-on is
[RE-007](../../BACKLOG/up-next/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md),
which is about moving more of the framed shell onto those explicit
seams and is intentionally deferred until after `v4.1.0`.

## Framed Shell: More Humane, More Truthful

The shell-focused work since `v4.0.0` substantially improves the framed
application experience. The key cycles are:

- [HT-002](../../design/HT-002-layered-focus-and-interaction.md)
- [HT-003](../../design/HT-003-implement-layer-stack-and-input-map-routing.md)
- [HT-004](../../design/HT-004-promote-explicit-layer-objects-and-richer-shell-introspection.md)

Notable outcomes:

- framed apps now use a clearer topmost-layer model for routing and
  dismissal
- help, settings, notifications, quit confirm, and page modals behave
  more like real shell layers and less like ad hoc branches
- footer and help affordances are more truthful to the actual active
  layer
- richer shell introspection is exported through helpers like
  `describeFrameLayerStack(...)`, `activeFrameLayer(...)`, and
  `underlyingFrameLayer(...)`

For operators, the result is calmer and safer fullscreen behavior. For
builders and agents, the shell is easier to reason about because it
advertises more of its actual state.

## Framed-App Typing And Command Lifecycles

The developer-experience work since `v4.0.0` is not just cosmetic. Two
important seams got more honest:

- [DX-001](../../design/DX-001-type-framed-app-messages-and-updates-end-to-end.md)
- [DX-002](../../design/DX-002-reconcile-cmd-typing-with-cleanup-and-effect-patterns.md)

The framed-shell surface now exports explicit typed helpers such as:

- `FramePageMsg`
- `FramePageUpdateResult`
- `FramedAppMsg`
- `FramedApp`
- `FramedAppUpdateResult`

And `Cmd<M>` now reflects the runtime patterns Bijou actually uses. A
command may:

- complete synchronously or asynchronously
- emit intermediate messages
- resolve to a final message
- resolve to `QUIT`
- return a cleanup handle or cleanup function for long-lived work
- resolve to `void`

That makes the public API line up better with real pulse timers,
runtime subscriptions, and sub-app command mapping.

## DOGFOOD: From Partial Demo To Real Field Guide

The DOGFOOD work since `v4.0.0` is one of the clearest visible changes.

The field guide moved through the coverage ratchet from early partial
coverage to complete coverage of all canonical component families,
culminating in
[DF-019](../../design/DF-019-raise-dogfood-coverage-floor-to-100-percent.md).

What changed:

- DOGFOOD now covers `35/35` canonical component families
- the coverage floor is enforced by repo tooling instead of being a
  decorative progress bar
- the docs app in [`examples/docs`](../../../examples/docs/README.md)
  is now a living product surface, not just a showcase shell
- the next DOGFOOD work is quality and depth, not pretending there is a
  hidden extra family-count milestone

This is important for both users and maintainers. Users get a much more
credible field guide. Maintainers get a stronger proving surface for
shell, design-language, and docs changes.

## Localization: Real Packages And Workflows

Localization moved from strategy-doc ambition into actual packages and
workflows.

The relevant landed work includes:

- [LX-001](../../design/LX-001-bijou-i18n-runtime-package.md)
- [LX-002](../../design/LX-002-bijou-i18n-tools-package.md)
- [LX-003](../../design/LX-003-spreadsheet-adapters-and-catalog-exchange-workflows.md)
- [LX-004](../../design/LX-004-provider-adapters-for-workbook-and-bundle-exchange.md)
- [LX-005](../../design/LX-005-rich-spreadsheet-and-filesystem-adapters.md)
- [LX-006](../../design/LX-006-xlsx-localization-adapters.md)
- [LX-008](../../design/LX-008-localize-shell-chrome-and-dogfood.md)

The workspace now includes:

- `@flyingrobots/bijou-i18n`
- `@flyingrobots/bijou-i18n-tools`
- `@flyingrobots/bijou-i18n-tools-node`
- `@flyingrobots/bijou-i18n-tools-xlsx`

And the shell/docs surface now has real localized behavior instead of
only English-first assumptions.

Important release note: `v4.1.0` should only be considered ready once
the i18n publish-surface decision is closed. The preferred outcome is
to expand the publish matrix so these packages are actually shipped as
public release artifacts.

## Design Language: More Explicit Product Taste

Bijou's design language is much less implicit than it was at `v4.0.0`.

The post-`v4.0.0` work established:

- explicit UX doctrine and content guidance
- a calmer explainability surface
- inspector rhythm and inspector drawer patterns
- stronger shell review-surface patterns
- more concrete design-system guidance across component families

Representative cycles include:

- [DL-001](../../design/DL-001-capture-design-language-doctrine.md)
- [DL-003](../../design/DL-003-prove-canonical-patterns-in-shared-surfaces.md)
- [DL-004](../../design/DL-004-prove-drawer-rhythm-and-notice-rows.md)
- [DL-005](../../design/DL-005-prove-inspector-and-guided-flow-rhythm.md)
- [DL-006](../../design/DL-006-prove-inspector-panel-rhythm.md)
- [DL-007](../../design/DL-007-promote-inspector-panel-block.md)

The result is that Bijou now has stronger answers to questions like:

- what should shell review surfaces feel like?
- how should AI reasoning be surfaced honestly?
- what does calm terminal hierarchy look like?
- which UI choices are doctrine, and which are merely possible?

## Performance, Validation, And Release Hardening

The repo also got materially stronger operationally.

Notable improvements since `v4.0.0`:

- renderer benchmark coverage and low-allocation renderer work
- stronger smoke tooling and example/workflow validation
- a DOGFOOD coverage gate
- a design-system docs preflight
- a workflow shell preflight
- a repo-native release readiness script
- improved publish and release-dry-run workflow compatibility

This work is less glamorous than the runtime and shell work, but it
matters because it makes the release more reproducible and the repo less
dependent on luck.

## Repo Signposts And Engineering Doctrine

The repository itself is easier to navigate and reason about than it was
at `v4.0.0`.

New or newly formalized repo surfaces include:

- [METHOD](../../METHOD.md)
- [BEARING](../../BEARING.md)
- [VISION](../../VISION.md)
- [System-Style JavaScript](../../system-style-javascript.md)
- [Release Guide](../../release.md)

This is mostly maintainer-facing, but it has a user-visible effect: the
repo is less likely to drift between code, docs, backlog, and release
claims.

## What This Release Is Best At

Compared to `v4.0.0`, this release is better when you need:

- a clearer fullscreen application substrate
- a calmer framed shell with more truthful interaction behavior
- a serious living docs surface instead of a demo stub
- first-class localization packages and workflow seams
- clearer guidance about how Bijou wants to be used

## What This Release Does Not Pretend

This release still does not mean:

- the runtime-engine migration is completely finished
- every shell concern has been pushed fully behind the runtime seams
- DOGFOOD is "done forever"
- localization is complete across every shell surface
- the i18n publish-surface gap is already solved just because the code
  exists in the workspace

The point is not that the work is finished. The point is that the repo
now has much more honest runtime truth, shell truth, docs truth, and
release truth than it had at `v4.0.0`.
