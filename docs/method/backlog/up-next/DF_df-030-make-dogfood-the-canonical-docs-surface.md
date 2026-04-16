---
title: DF-030 Make DOGFOOD the canonical docs surface
legend: DF
lane: up-next
priority: high
keywords:
  - dogfood
  - docs
  - packages
  - design-system
  - doctrine
  - release
  - recursive-ingest
  - honesty
---

# DF-030 Make DOGFOOD the canonical docs surface

DOGFOOD claims to be the repository's canonical human-facing docs surface, but
today it still hand-publishes a subset of the real docs tree. Some package
pages defer readers back out to package READMEs or the repo, and newer repo
docs such as design-system guidance can exist on disk without becoming visible
in-app. That breaks the "Docs Are the Demo" contract and makes DOGFOOD feel
more like a curated directory than the actual reading surface.

Concrete failure mode:
- in `Packages`, some package docs still effectively say "go read the package
  repo/README" instead of surfacing that package's real install, usage, and
  guidance content inside DOGFOOD
- the i18n package lane is a visible example of this dishonesty
- design-system docs can be updated on disk and still not appear as first-class
  DOGFOOD pages; `docs/design-system/theme-authoring.md` is a concrete example
- the current docs app shape is registry-driven, so repo truth can drift unless
  the docs surface is derived from the real docs corpus

What needs to be true instead:
- DOGFOOD should recursively ingest the repository's real docs corpus and
  publish it in-app as the primary reading surface
- this scope must include package docs, design-system docs, doctrine/signpost
  docs, architecture/invariants guidance, and release docs, not just package
  READMEs
- package pages may still link to source files, but they should not offload the
  actual docs burden back to the filesystem or GitHub
- the docs navigation should be shaped from repo truth, with room for curated
  presentation, instead of silently depending on a hand-maintained page subset
- excerpted, generated, or intentionally omitted content should be labeled
  honestly in the DOGFOOD reader

This is not just a copy pass. It is a docs-system honesty bug.
