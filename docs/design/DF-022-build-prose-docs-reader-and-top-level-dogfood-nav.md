# DF-022 — Build Prose Docs Reader And Top-Level DOGFOOD Nav

Legend: [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-021 — Shape DOGFOOD As Terminal Docs System](./DF-021-shape-dogfood-as-terminal-docs-system.md)

## Sponsor human

A builder or maintainer who expects DOGFOOD to behave like a real docs
site shell instead of only a component-family browser.

## Sponsor agent

An agent that must inspect DOGFOOD and answer:

- where the top-level docs sections live
- whether DOGFOOD can read prose docs inside the app
- whether the component explorer is still being mistaken for the whole
  docs product

## Hill

DOGFOOD visibly behaves like a terminal-native docs shell with top-level
section tabs and a real prose-doc reader, while keeping the component
explorer as one important section rather than the whole app.

## Why this cycle exists

`DF-021` reframed the release honestly: DOGFOOD had enough shell and
component breadth to feel substantial, but it still behaved like a
components-only product.

That meant `4.1.0` still lacked a visible docs-site shell:

- there was no top-level section navigation
- there was no prose-doc reader inside the app
- users could not tell where non-component docs were supposed to live

This cycle closes that shell-shape gap without pretending the full repo,
package, release, doctrine, and architecture corpus has already landed.

## Playback questions

1. Does DOGFOOD now expose top-level docs navigation instead of a single
   component-only page?
2. Is the default docs route a prose-reader-oriented section rather than
   dropping directly into the component explorer?
3. Can a user visibly switch between `Guides`, `Components`,
   `Packages`, `Philosophy`, and `Release`?
4. Does the component browser still work as one section inside the docs
   shell?
5. Is the remaining `4.1.0` blocker work now clearly about publishing
   the real corpus rather than inventing the shell shape?

## Accessibility / assistive reading posture

The new reader must stay keyboard-first and text-legible. It cannot rely
on screenshots, pointer-only interaction, or color alone to communicate
the new section structure.

## Localization / directionality posture

Section titles and shell hints should stay localizable. This cycle does
not block on translating the starter prose corpus, but the shell shape
must not hard-code a components-only reading model.

## Agent inspectability / explainability posture

The repo should make the new shell shape explicit in:

- this cycle doc
- the DOGFOOD app implementation
- the `v4.1.0` blocker lane
- the release signposts and tests

An agent should be able to prove that `DF-022` closed and that the
remaining blocker work is now corpus publication.

## Non-goals

- importing the full repo docs corpus in this cycle
- closing package, release, doctrine, or architecture content gaps
- replacing every bespoke DOGFOOD surface
- inventing a general animation or text-effects API as part of this work

## Decision

For `4.1.0`, DOGFOOD should expose the full section map immediately:

- `Guides`
- `Components`
- `Packages`
- `Philosophy`
- `Release`

`Guides` becomes the default docs route and carries the initial prose
reader foundation. The other non-component sections get a visible home
now, even if their deeper corpus still lands in follow-on blocker
cycles.

## Implementation outline

1. Promote DOGFOOD from a one-page framed app to a top-level tabbed docs
   shell.
2. Add a prose-reader page model with guide navigation and scrollable
   main-doc surfaces.
3. Keep the existing component explorer intact as the `Components` tab.
4. Seed DOGFOOD with starter markdown pages that explain the docs map
   and make the missing sections visible.
5. Reduce the remaining `4.1.0` blockers to real corpus publication:
   `DF-023` and `DF-024`.

## Evidence

- the docs app now defaults to `Guides`
- the framed header exposes multiple top-level docs sections
- `Components` still contains the family/story/variant explorer
- DOGFOOD can render prose markdown pages from a starter corpus
- the `v4.1.0` blocker lane now only carries the remaining corpus work

## Retrospective

The important correction here is architectural, not decorative: DOGFOOD
stops overclaiming that "component docs" equals "the whole Bijou docs
product."

The remaining release blocker work is now narrower and more honest:

- `DF-023` should publish repo/package/release guidance into the visible
  shell
- `DF-024` should publish philosophy/architecture/doctrine guidance into
  the visible shell
