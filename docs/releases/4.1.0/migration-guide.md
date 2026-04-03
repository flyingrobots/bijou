# Migration Guide: Bijou v4.0.0 To v4.1.0

This guide is for users already on `v4.0.0` who want to move to
`v4.1.0`.

If you are coming from an older major line, read
[`MIGRATING_TO_V4.md`](../../MIGRATING_TO_V4.md) first.

## Migration At A Glance

Not every user has real migration work to do.

| If you use... | Expected migration effort | Why |
| --- | --- | --- |
| `@flyingrobots/bijou` for CLI output, prompts, and string-first flows | Low | Most `v4.1.0` work is additive or docs-facing for this surface. |
| `@flyingrobots/bijou-tui` for fullscreen runtime apps | Medium | The runtime and command model are more explicit, and you should align with the newer seams. |
| `@flyingrobots/bijou-tui-app` / `createFramedApp()` heavily | Medium to High | Framed-shell typing, layer routing, and shell inspection surfaces are more explicit, so old assumptions may need cleanup. |
| custom runtime internals or shell-adjacent helpers | High | The repo is moving toward runtime-engine seams and away from branch-order shell folklore. |
| localization workflows | Optional but meaningful | Entirely new packages and workflows exist now if you want them. |

## Upgrade Checklist

1. Upgrade all Bijou packages together to the same version.
2. Rebuild and re-typecheck before making behavioral changes.
3. Audit framed-shell typing if you use `createFramedApp()`.
4. Audit custom command code if you rely on long-lived effects or
   subscriptions.
5. Replace shell-folklore assumptions with exported layer/runtime
   helpers where possible.
6. Adopt the new localization packages only if you need that surface.
7. Re-run your fullscreen and shell interaction tests, especially for
   help/settings/notification/quit flows.

## 1. Upgrade In Lock-Step

Bijou still versions its published packages in lock-step.

Upgrade the packages you use together:

```bash
npm install @flyingrobots/bijou@4.1.0 @flyingrobots/bijou-node@4.1.0
```

Add the fullscreen packages if your app uses them:

```bash
npm install @flyingrobots/bijou-tui@4.1.0 @flyingrobots/bijou-tui-app@4.1.0
```

If you adopt the new localization surface, also add the relevant i18n
packages:

```bash
npm install @flyingrobots/bijou-i18n@4.1.0 @flyingrobots/bijou-i18n-tools@4.1.0
```

Important note: `v4.1.0` should only be treated as fully ready once the
i18n publish-surface decision is closed. Verify package availability on
npm before relying on those package names in a published app.

## 2. Framed Apps: Move Onto The Typed Shell Surface

If your app uses `createFramedApp()`, this is the migration area most
likely to matter.

The shell now exports explicit framed message and update helpers:

- `FramePageMsg<Msg>`
- `FramePageUpdateResult<PageModel, Msg>`
- `FramedAppMsg<Msg>`
- `FramedAppUpdateResult<PageModel, Msg>`
- `FramedApp<PageModel, Msg>`

### What to change

- stop treating framed page updates as effectively `any`
- update explicit type annotations that assumed page messages were only
  your raw app `Msg`
- update tests that asserted the framed shell collapsed everything back
  to plain `Msg`

### Typical before/after mindset

Before:

- the page/shell seam was often typed loosely
- external casts papered over framed-shell complexity

After:

- the page/shell seam should stay typed explicitly
- page updates should accept `FramePageMsg<Msg>` where appropriate
- framed app updates should be allowed to return
  `Cmd<FramedAppMsg<Msg>>[]`

If your code was already mostly inference-driven and you were not
fighting the shell types directly, you may have little to change. If
you have custom wrapper helpers around `createFramedApp()`, inspect them
carefully.

## 3. Commands: Stop Pretending They Only End In Messages

`Cmd<M>` now models the runtime more honestly.

A command may now:

- complete synchronously or asynchronously
- emit intermediate messages through `emit(...)`
- resolve to a final message
- resolve to `QUIT`
- return a cleanup handle or cleanup function
- resolve to `void`

### What to look for

- custom command wrappers that assume every command returns a final
  message
- tests that stub commands as only `Promise<Msg | undefined | QUIT>`
- child-app command mapping that accidentally discards cleanup results

### What to do

- widen your local command typings if you mirrored the old narrower
  contract
- prefer the built-in sub-app lifecycle helpers if you were manually
  coercing command results
- treat cleanup-producing commands as first-class runtime work, not as
  hacks that need `any`

If you only use built-in helpers like `tick()`, `animate()`, or normal
message-returning commands, this may be invisible to you. The migration
is most relevant for custom runtime work and command composition helpers.

## 4. Shell Layers: Use The Exported Truth

If you wrote code or tests that reason about shell layering indirectly,
update them to prefer the exported shell inspection surface:

- `describeFrameLayerStack(...)`
- `activeFrameLayer(...)`
- `underlyingFrameLayer(...)`

### Why this matters

Since `v4.0.0`, the shell has become more explicit about:

- topmost-layer ownership
- dismissal order
- footer/help truth
- settings/search/help/notification/quit layering

That means older tests or utilities that inferred shell state from raw
render order, footer strings, or branch order inside `app-frame.ts` are
more likely to drift.

### What to re-test

- `Esc` behavior
- search/help/settings transitions
- notification center and history behavior
- quit confirmation flows
- mouse shielding while exclusive overlays are open

## 5. Runtime Internals: Prefer Engine Seams Over Shell Folklore

If you extend or inspect runtime internals directly, start moving
toward the explicit runtime-engine exports introduced since `v4.0.0`.

The relevant surfaces are the `RE` slices:

- state machine and view stack ownership
- retained layouts and invalidation
- layout-driven input routing
- command/effect buffering
- component layout and interaction contracts

This does **not** mean the migration is complete. The repo still tracks
[RE-007](../../BACKLOG/up-next/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
because some framed-shell behavior still needs to move more fully onto
those seams.

The practical rule is:

- prefer exported runtime seams where they exist
- avoid adding new shell-only branch-order logic if you can use the
  runtime-engine model instead

## 6. Localization Is Opt-In, Not Forced

If you do not need localization, you do not need to migrate code just
because the new localization packages exist.

If you do want localization, `v4.1.0` gives you a real substrate:

- runtime locale/direction contracts
- tools for catalogs and exchange workflows
- Node filesystem adapters
- XLSX-oriented tooling
- localized shell chrome and DOGFOOD surfaces

That is an adoption opportunity, not a forced migration.

## 7. Docs And DOGFOOD Usually Require No App Migration

Most of the DOGFOOD, design-system, METHOD, and release-doc work does
not require code changes in downstream apps.

It does change what is now available to you:

- a much more complete field guide
- stronger component-family guidance
- clearer repo doctrine and release documentation

Treat these as improved references, not breaking changes.

## 8. Validation Checklist After Upgrading

For a normal app upgrade, run at least:

```bash
npm run build
npm test
```

If your app uses TypeScript and the fullscreen runtime, also run your
typecheck and any shell smoke tests you have.

Pay special attention to:

- framed shell compile errors
- command typing errors
- tests around help/settings/search/quit
- notification history and overlay behavior
- mouse interaction over modal/help/palette surfaces

## 9. Migration Recommendations By App Shape

### Core CLI / prompt app

Usually:

- upgrade dependencies
- rebuild
- read the new docs when you want deeper design-system guidance

### Fullscreen TUI app without heavy shell customization

Usually:

- upgrade dependencies
- fix any framed typing fallout
- re-test shell overlays and interaction flows

### Fullscreen app with custom shell helpers or runtime extensions

Usually:

- audit command typings
- audit shell-layer assumptions
- move toward exported framed/runtime helpers
- re-run high-signal interaction tests

### Localization-aware app

Usually:

- decide whether to adopt the new i18n packages now or later
- verify package availability in the published release
- add localized shell copy incrementally instead of rewriting the whole
  app at once

## Final Advice

Compared with the `v4.0.0` migration, `v4.1.0` is less about one hard
boundary change and more about aligning your app with clearer repo
truth.

The important upgrades are:

- accept the typed framed-shell surface
- accept the more honest `Cmd<M>` contract
- trust exported shell/runtime inspection helpers over folklore
- adopt localization only if and when you need it

If your app is mostly core Bijou plus light TUI usage, the migration
should be manageable. If you have deep custom shell/runtime code, this
is a good release to pay down those assumptions.
