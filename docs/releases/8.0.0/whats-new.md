# What's New in Bijou 8.0.0-rc.1

A release candidate, published so the breaking changes below can be validated
against real applications before `8.0.0` is cut. Pin the exact version; the
dist-tag is `rc`, not `latest`.

## The headline is a deletion

`detectOutputMode()` no longer looks at `NO_COLOR`.

That variable means one thing: do not send me colour. It has never meant "do not
draw a user interface". Bijou read it as a capability signal, so a developer who
had `NO_COLOR=1` in their shell profile did not get a monochrome TUI — they got no
TUI. Every component dropped to its single-frame form, and the quit confirmation
stopped asking.

The tell was that two first-party consumers had each independently written their
own detector to route around it. `git-cas` ships a `detectCliTuiMode` with a
comment explaining the problem; `muniment` wrote the same override for the same
reason. When consumers reimplement your detector, the detector is answering a
question they did not ask.

Colour is unaffected — it was never coupled to the mode in the implementation,
only in the detector. `NO_COLOR` is read independently in three places, none of
which consult `ctx.mode`, so with it set you still get `theme.noColor === true`
and unstyled output. What you also get now is a working TUI.

The test for this is the shape worth stealing. Rather than assert which mode
`NO_COLOR` produces, the property asserts that adding `NO_COLOR` to *any*
environment leaves that environment's mode unchanged — the contract stated
directly, over 200 generated combinations of value, TTY state, `CI`, and `TERM`.

## An unknown status key no longer looks cancelled

`ctx.status('typo')` used to fall back to `status.muted`, and `status.muted`
carries `strikethrough` in every shipped preset. So a mistyped key — or a key an
application meant to define and didn't — rendered text with a line through it. The
reader sees "cancelled". The application never said that.

It now falls back to `semantic.muted`, which is dim and nothing else, matching
what the sibling `ui()` accessor already did with `semantic.primary`.

This one came out of a real application shipping the bug: a painter was declared,
its status key was later dropped from the theme as a duplicate, and the painter
kept resolving to the fallback. Nothing caught it — not the type checker, not a
palette audit, not review — because no view had called it yet.
[#521](https://github.com/flyingrobots/bijou/issues/521) tracks typing the
accessors so that becomes a compile error.

## `extendTheme()` can finally reach every group

`Theme` has six token groups. `extendTheme()` accepted extensions for four, which
sounds like an oversight and behaves like a trap, because the shipped presets
alias one colour across the groups you could not reach.

`bijou-dark` paints `status.warning`, `status.active`, `semantic.warning`,
`semantic.accent`, `ui.cursor`, `ui.focusGutter`, `ui.sectionHeader`, `ui.logo`,
`border.secondary` and `border.warning` in a single amber. Ten tokens. So
`extendTheme(BIJOU_DARK, { status })` gave you your statuses and left that amber
running every heading, cursor and border — and if one of your new statuses was
also amber-ish, your headings became indistinguishable from your warnings. That
is how this was found, at ΔE 0.023 in OKLab.

`border` and `semantic` are now reachable. They are overridable rather than
extensible, since `Theme` fixes their key sets.

The alias itself is still there. `extendTheme()` makes it escapable, not fixed —
see [#519](https://github.com/flyingrobots/bijou/issues/519), which also records
that `error` and `success` collapse to ΔE 0.059 under protanopia in the dark
preset and 0.064 in the light one, and that `bijou-light`'s severity ladder is
inverted in lightness. If you rely on the shipped presets to distinguish
severities, read that issue.

## Also in this candidate

Everything that accumulated on `main` since `7.2.0`:

- **Profunctor Page terminal inspection** — `lowerProfunctorPageArtifacts()`
  validates the canonical `profunctor-page/0` family and emits deterministic
  scene IR, surfaces, target maps, receipts, cell source maps, and text evidence
  across six inspection modes, with unsupported browser semantics kept as
  explicit capability residuals.
- **VISOR artifact bundle proof** — `createVisorArtifactBundleFromGraphql()`,
  `createVisorArtifactBundle()`, and the `visor-artifact-bundle/1` types.
- **RE-036 packed-cell receipts** — `adaptPackedBijouCellsToSurface()` copies
  validated bytes and side-table entries without re-encoding cells.
- **Dependency-security closeout** — patched floors across the resolved graph,
  with a regression binding them and a clean `npm ci` reproducing a
  zero-vulnerability audit.
- **Code Dojo ratchet progress** — tranches A through E, plus the DX-050
  prerequisites, DOGFOOD localization debt, and documentation-contract work.

## What this candidate is for

Two behaviour changes that are correct in principle and unproven in the field.
If `NO_COLOR` or a custom theme matters to your application, this is the version
to try before `8.0.0` exists.

Read the [migration guide](./migration-guide.md) for the specific things to check,
and the [release evidence packet](./README.md) — which is explicit about which
evidence was replayed for this candidate and which was inherited, because nine of
eleven release-law review gates are still unreviewed. That is exactly why this is
an rc and not a release.
