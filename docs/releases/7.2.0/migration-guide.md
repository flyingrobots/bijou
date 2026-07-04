# Migrating to Bijou 7.2.0

Bijou 7.2.0 is a minor release from 7.1.0. It is intended to be additive for
applications using documented public APIs.

The release is still pending its final tag. These instructions are staged so
the migration guide is available before the version bump lands.

## Recommended Upgrade

Update the runtime packages your app uses together:

```bash
npm install \
  @flyingrobots/bijou@7.2.0 \
  @flyingrobots/bijou-node@7.2.0 \
  @flyingrobots/bijou-tui@7.2.0 \
  @flyingrobots/bijou-tui-app@7.2.0
```

If your app uses localization tooling, keep those packages in lock-step too:

```bash
npm install \
  @flyingrobots/bijou-i18n@7.2.0 \
  @flyingrobots/bijou-i18n-tools@7.2.0 \
  @flyingrobots/bijou-i18n-tools-node@7.2.0 \
  @flyingrobots/bijou-i18n-tools-xlsx@7.2.0
```

If your app uses the Bijou MCP server, keep it lock-step too:

```bash
npm install @flyingrobots/bijou-mcp@7.2.0
```

## Runtime Behavior

No breaking runtime migration is expected.

Applications may notice better behavior in these areas:

- page-scoped TUI frame helpers are exported from the public TUI package root
- scripted driver helpers can replay mouse movement, press, release, wheel,
  and raw SGR mouse sequences deterministically
- DOGFOOD light-theme and locale-fallback examples provide clearer evidence for
  release review and demos
- Blocks app-binding documentation now includes concrete copyable snippets

If your app had local test helpers for mouse replay or frame helper imports,
prefer the package exports after upgrading.

## DOGFOOD And Documentation

The DOGFOOD release pages for 7.2.0 depend on the versioned docs in this
directory. Keep `whats-new.md`, `migration-guide.md`, and `README.md` together
when preparing a release branch, before changing package metadata to `7.2.0`.

## Release Tooling

Maintainers preparing the release should use both release-readiness modes:

```bash
npm run release:readiness
npm run release:readiness -- --milestone v7.2.0
```

The plain command validates local release evidence before the milestone is
closed. The milestone-aware command is the final release gate and must pass
after the release-gate PR has merged, the target milestone has zero open tracker
items, and no tracked work carries a `work-in-progress` label.

## Compatibility Stance

Bijou 7.2.0 should be a straightforward upgrade from 7.1.0 for application
code. The main migration work is optional cleanup: remove local mouse replay
fixtures that duplicate the public driver helpers, update imports to use the
public TUI package root where possible, and treat the improved DOGFOOD release
pages as review evidence rather than an application contract.
