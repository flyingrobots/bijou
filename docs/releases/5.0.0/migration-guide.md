# Migrating to Bijou 5.0.0

Bijou 5.0.0 does not require a wholesale rewrite for most 4.4.x apps.
The main migration story is that the preferred hosted and theme-selection
paths are now simpler and more explicit than the lower-level wiring that
earlier releases required.

## Framed Apps: Prefer The Self-Running Entry Points

If you currently do this:

```ts
const app = createFramedApp(options);
await run(app, { ctx });
```

prefer one of these in 5.0.0:

```ts
const app = createFramedApp(options);
await app.run({ ctx });
```

or:

```ts
await runFramedApp(options, { ctx });
```

Why move:

- the framed shell now owns its hosted runner directly
- the run-time `ctx` is applied to shell-owned rendering
- frame timing and budget telemetry are wired back into `FrameModel`
- `startApp(app)` now delegates to this path automatically when the app
  is a self-running framed shell

Existing `run(createFramedApp(...))` code may still work, but it is no
longer the preferred entrypoint.

## Theme Selection: Move It Up To The Host Layer

If you previously built a custom Node context just to apply a theme,
prefer the host-owned APIs:

```ts
await startApp(app, { theme: MY_THEME });
```

For paired dark/light themes, use a theme set:

```ts
await startApp(app, {
  themes: [
    { id: 'light', theme: LIGHT_THEME },
    { id: 'dark', theme: DARK_THEME },
  ],
  themeMode: 'auto',
  themeOverride: savedThemeId,
});
```

The same selection model is also available through:

- `createNodeContext({ theme })`
- `createNodeContext({ themes, themeMode, themeOverride })`
- `initDefaultContext({ theme })`
- `initDefaultContext({ themes, themeMode, themeOverride })`

If you pass both `ctx` and `theme`, the explicit `ctx` still wins.

## Interactive Smoke: Use The Dedicated Verification Lane

If you maintain custom CI or local proof commands around the interactive
examples, prefer:

```bash
npm run verify:interactive-examples
```

The old scripted-example path now lives in that dedicated integration
lane so the main unit suite can stay deterministic. The real examples
still run; they just no longer masquerade as cheap unit tests.

## No Manual Migration Needed For These Fixes

These changes land automatically once you upgrade:

- `markdown()` now renders bounded pipe tables through Bijou's real
  table surface
- fatal crash mode no longer hangs forever when `stdin` is not a TTY
- `scopedNodeIO()` rejects symlink escapes across the declared root
  boundary
- focused browsable rows can marquee overflowing labels in shared list
  surfaces such as DOGFOOD navigation

## Compatibility Stance

Bijou 5.0.0 is a major line because the framework is drawing harder
boundaries around hosted runtime ownership, theme selection, and release
proof, not because most apps are expected to break. If your app already
stays on the public APIs, the practical migration should usually be
small and mostly about adopting the cleaner host entrypoints.
