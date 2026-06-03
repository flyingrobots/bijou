# Migrating to Bijou 7.0.0

Bijou 7.0.0 carries the V6 layout floor and V7 Product Truth lane into one
major release. Most application code that stayed on public APIs should keep
working, but maintainers should check the areas below before upgrading.

## Keep The 5.0 Hosted App Entrypoints

The preferred hosted app path from 5.0.0 remains the right path:

```ts
const app = createFramedApp(options);
await app.run({ ctx });
```

or:

```ts
await runFramedApp(options, { ctx });
```

If your app still calls lower-level runners directly, this is a good release
to move back to the frame-owned hosted entrypoints so shell timing, theme, and
runtime behavior stay in one place.

## Check Table Width Expectations

`table()` and `tableSurface()` now use bounded-width behavior by default for
human-mode output. If your app expected tables to grow to intrinsic content
width regardless of terminal size, opt into intrinsic layout explicitly.

For most terminal UIs, the new default is what you want: columns fit the target
width, wrapped cells preserve word boundaries when possible, and lower-mode
pipe formats remain deterministic.

## Prefer Standard Blocks For Product Semantics

Bijou 7.0.0 exports a much broader standard Block catalog. If your app has
custom semantic surfaces for status, feedback, navigation, disclosure, dense
comparison, hierarchy, text entry, or documentation-like content, evaluate the
new standard Blocks before inventing another local schema.

Blocks should own product semantics, data contracts, command intents, and
lowering facts. Leaf components should remain the rendering vocabulary.

## Route Localization Through The Runtime Port

`@flyingrobots/bijou-i18n` now provides structured localization results instead
of only returning strings. New localization code should preserve the returned
metadata: key, locale, direction, entry kind, fallback or missing status,
issues, and facts.

If your app persists locale preference, keep that persistence in a host adapter
or other boundary-owned port. DOGFOOD uses this shape so runtime locale changes
are visible without making app logic read process globals directly.

## Notification Overlays Need No Workaround

Live notification rows now wrap at word boundaries when possible. Remove any
app-local workaround that pre-wrapped notification titles, bodies, or action
labels only to avoid split words in Bijou overlays.

Long unbroken text still hard-wraps inside the assigned notification width, so
callers do not need to pre-truncate machine identifiers or hashes for layout
safety.

## Release And DOGFOOD Proof Are Stricter

DOGFOOD now reads version-specific release docs from:

```text
docs/releases/<package-version>/whats-new.md
docs/releases/<package-version>/migration-guide.md
```

When preparing a release branch, bumping package versions without adding those
docs will fail the docs and DOGFOOD test lanes. This is intentional: the
package version and current release documentation must move together.

## Compatibility Stance

Bijou 7.0.0 is a major release because public contracts are broader and more
explicit, not because every app must rewrite. The main migration work is to
remove local workarounds that are now framework-owned and to adopt the standard
contracts where they replace app-local semantic surfaces.
