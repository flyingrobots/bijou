---
title: DF-030 Make DOGFOOD the canonical package-docs surface
legend: DF
lane: up-next
priority: high
keywords:
  - dogfood
  - docs
  - packages
  - package-readmes
  - honesty
---

# DF-030 Make DOGFOOD the canonical package-docs surface

DOGFOOD claims to be the documentation product, but some package pages still
defer readers back out to package READMEs or the repo instead of surfacing the
actual docs inside the app. That breaks the "Docs Are the Demo" contract and
makes the in-app package lane feel like a directory of links instead of the
canonical reading surface.

Concrete failure mode:
- in `Packages`, some package docs still effectively say "go read the package
  repo/README" instead of surfacing that package's real install, usage, and
  guidance content inside DOGFOOD
- the i18n package lane is a visible example of this dishonesty

What needs to be true instead:
- DOGFOOD should recursively pull package docs from the Bijou workspace and
  present them in-app as the primary reading surface
- package pages may still link to source files, but they should not offload the
  actual docs burden back to the filesystem or GitHub
- package-level install, usage, and caveat sections should be excerpted or
  composed into the DOGFOOD reader with repo-truth metadata
- the package lane should make it obvious when content is excerpted, generated,
  or intentionally omitted

This is not just a copy pass. It is a docs-system honesty bug.
