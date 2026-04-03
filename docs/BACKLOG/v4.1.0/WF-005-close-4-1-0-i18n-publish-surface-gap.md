# WF-005 — Close 4.1.0 i18n Publish-Surface Gap

Legend: [WF — Workflow and Delivery](../../legends/WF-workflow-and-delivery.md)

## Idea

Before shipping `4.1.0`, resolve the mismatch between:

- the repo's public story, which now includes the new i18n packages
- the automated release pipeline, which still publishes only the older
  five packages

## Why

[WF-004](../../design/WF-004-shape-the-next-release.md) shaped `4.1.0`
as a release that includes real localization substrate work.

That creates a hard release question:

- Are the i18n packages part of the public `4.1.0` release or not?

Right now the workflows say "not yet," while the repo story reads much
closer to "yes." That is release drift.

## Likely scope

- decide which i18n packages are meant to publish in `4.1.0`
- if public, expand `publish.yml` and `release-dry-run.yml`
- if not public, narrow the `4.1.0` release promise explicitly
- update any affected release docs and verification steps
- add or update tests around the chosen publish surface

## Done when

One repo-visible answer exists:

- either the i18n packages are in the automated release path
- or the `4.1.0` release docs stop implying they are released artifacts

No ambiguity should remain between code, docs, and publish automation.
