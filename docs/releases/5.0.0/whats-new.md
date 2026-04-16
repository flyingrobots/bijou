# What's New in Bijou 5.0.0

Bijou 5.0.0 promotes the hosted shell, Node host bootstrapping, and
release-proof surface into a cleaner first-class product line. Most
existing 4.4.x apps continue to work, but the preferred paths are now
simpler, more explicit, and more honest about what the framework owns.

## Framed Apps Own Their Hosted Runner

`createFramedApp()` now returns a self-running framed shell:

```ts
const app = createFramedApp(options);
await app.run({ ctx });
```

There is also a one-call hosted helper:

```ts
await runFramedApp(options, { ctx });
```

What changed:

- framed apps now own their hosted runtime path through `app.run(...)`
  instead of forcing callers to remember a separate `run(app, ...)`
  wrapper
- `@flyingrobots/bijou-node` `startApp(app)` detects and delegates to
  that self-running path automatically
- the framed runner uses the run-time `ctx` as the shell-owned
  rendering context for the duration of the run
- committed pipeline timings are folded back into `FrameModel` so
  shell-owned UI can read `frameTimeMs`, `viewTimeMs`, `diffTimeMs`,
  `frameBudgetMs`, and `frameOverBudget`

This is the biggest posture change in the release: the frame now owns
its hosted shell surface more honestly instead of pretending it is just
another raw TEA app.

## Node Hosts Get Easy Theme Selection

Node-hosted apps can now opt into a custom theme without assembling a
raw `BijouContext` by hand:

```ts
await startApp(app, { theme: MY_THEME });
```

The host also supports theme sets with automatic light/dark selection
and explicit user override:

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

Selection order is:

1. `themeOverride`
2. `BIJOU_THEME`
3. `themeMode: 'auto'` terminal color-scheme detection
4. first theme-set entry fallback

This makes dark/light mode and persisted user choice a host concern
instead of boilerplate that every app has to reinvent.

## The Proof Surface Is More Honest

Several repo-facing and operator-facing surfaces were tightened up in
this release:

- `markdown()` now renders bounded pipe tables through the real table
  component instead of leaking raw Markdown separators into DOGFOOD and
  other prose views
- the root workspace now exposes `npm run perf` as a first-class visual
  performance demo entrypoint
- the scripted interactive smoke path is deterministic and isolated in
  `verify:interactive-examples` instead of depending on Vitest's default
  timeout or global `console.*` monkeypatching
- focused rows in browsable lists can now marquee overflowing labels,
  which DOGFOOD uses in its constrained navigation lanes

The release-proof story is still centered on DOGFOOD, but the harness
and the docs surface are both less accidental than they were in 4.4.x.

## Runtime And Filesystem Hardening

Bijou 5.0.0 also closes two high-value hardening gaps:

- fatal crash mode now exits automatically after rendering the crash
  surface when `stdin` is not a TTY, so CI and scripted hosts no longer
  hang waiting for an Enter key they can never send
- `scopedNodeIO()` now resolves symlinked prefixes before enforcing the
  root boundary, rejecting reads and writes that tunnel outside the
  declared root through symlinked files or directories

The workspace also pins `hono` to `4.12.14` through root `overrides`,
closing the MCP server's transitive exposure to
`GHSA-458j-xx4x-4375`.

## Compatibility

Bijou 5.0.0 is a major release because it resets the hosted/app-shell
line around clearer ownership and release-proof contracts, not because
everyday apps need a wholesale rewrite. Most 4.4.x code will continue
to run, but framed apps and Node hosts now have better default paths
than the lower-level wiring that earlier releases required.
