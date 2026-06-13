# Migrating to Bijou 7.1.0

Bijou 7.1.0 is a minor release from 7.0.0. It is intended to be additive for
applications using documented public APIs.

## Recommended Upgrade

Update all Bijou packages together:

```bash
npm install \
  @flyingrobots/bijou@7.1.0 \
  @flyingrobots/bijou-node@7.1.0 \
  @flyingrobots/bijou-tui@7.1.0 \
  @flyingrobots/bijou-tui-app@7.1.0
```

If your app uses localization tooling, keep those packages in lock-step too:

```bash
npm install \
  @flyingrobots/bijou-i18n@7.1.0 \
  @flyingrobots/bijou-i18n-tools@7.1.0 \
  @flyingrobots/bijou-i18n-tools-node@7.1.0 \
  @flyingrobots/bijou-i18n-tools-xlsx@7.1.0
```

## Runtime Behavior

No breaking runtime migration is expected.

Applications may notice better behavior in these areas:

- full-screen TUIs repaint correctly after terminal resize, laptop sleep/wake,
  or external-display geometry changes
- ANSI parsing correctly handles scoped foreground/background resets
- DOGFOOD Blocks guide navigation can focus parent preview rows
- quit confirmation copy is less redundant

If your app had local workarounds for stale cells after resize or manual ANSI
reset cleanup, retest those paths against 7.1.0 and remove the workaround if
Bijou now owns the behavior.

## New Proof APIs

The new `ui-scene-ir/1` and GraphQL block helpers are available for early proof
work, but they are still the first slices of a larger Runtime Graph direction.
Use them when you want deterministic receipts, source maps, lower modes, and
agent-readable debug facts. Do not assume they are the final V8 product
contract yet.

## Theme Work

Theme-token APIs are more useful in 7.1.0, including first-party dark/light
presets and safe-pair declarations. Existing raw-color code should keep
working. New code should prefer semantic token refs when the color is part of a
themeable product surface.

## Release Tooling

Maintainers preparing releases should use:

```bash
npm run release:readiness -- --milestone vX.Y.Z
```

The milestone-aware mode blocks missing release evidence packets, open target
issues, lingering `work-in-progress` labels, stale release posture docs, and
missing package-smoke coverage before the local gauntlet runs.

DOGFOOD contributors should also expect `npm run dogfood:i18n:debt` to scan
new `examples/docs/**/*.ts` modules by default. Tooling-only exclusions must be
explicit.

## Compatibility Stance

Bijou 7.1.0 should be a straightforward upgrade from 7.0.0 for application
code. The main migration work is optional cleanup: remove local resize/ANSI
workarounds, adopt theme tokens where they clarify product intent, and use the
new proof helpers only where deterministic UI evidence is valuable.
