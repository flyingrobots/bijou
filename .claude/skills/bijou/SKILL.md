---
name: bijou
description: Build terminal applications with Bijou (@flyingrobots/bijou, bijou-tui, bijou-node). Use when writing or changing a Bijou app, choosing which Bijou component fits a job, theming or styling one, adding motion or transitions, localizing, or testing and recording Bijou output.
---

# Bijou

Bijou is a TypeScript toolkit for terminal applications. An app is a TEA loop (`init`, `update`, `view`) whose
`view` returns a **Surface**: a grid of styled cells. Components render into Surfaces, and every component renders
honestly in four **output modes**: `interactive`, `static`, `pipe`, and `accessible`. The way a component keeps its
meaning in a less capable mode is its **lowering**. Lowering is the idea to hold onto: every choice below serves it.

Packages: `@flyingrobots/bijou` (core: components, themes, Surface, viz), `@flyingrobots/bijou-tui` (runtime,
framed app shell, layout, overlays, motion), `@flyingrobots/bijou-node` (Node host: context, styling, recording),
`@flyingrobots/bijou-tui-app` (an opinionated shell), `@flyingrobots/bijou-i18n` (localization runtime).

## Steps

1. **Pick the app shape.** One screen or one prompt: a plain `App` run with `startApp(app)`. Several views,
   overlays, a command palette, settings, or help: `createFramedApp({ pages })`. A tab-bar-and-drawer app fast:
   `createTuiAppSkeleton()` from bijou-tui-app, or `npm create bijou-tui-app@latest my-app`.
   Read [references/app-runtime.md](references/app-runtime.md) before writing the loop, keys, or pages.
2. **Choose each component by its job**, not its look. Find the family whose *Use when* matches and whose
   *Avoid when* doesn't, using [references/components.md](references/components.md). Look-alikes (tabs vs
   stepper vs paginator, alert vs toast vs notification, modal vs drawer) are disambiguated there.
3. **Stay on the Surface path.** Inside a TUI, compose with the `*Surface` variants (`boxSurface`,
   `tableSurface`, `alertSurface`, `viewportSurface`, ...) and `Surface.blit`. Plain string forms (`box`, `table`)
   are the text-lowering path for pipe output and string composition. `view` never returns a raw string.
4. **Style through tokens.** Colours come from the theme (`ctx.semantic('accent')`, `ctx.surface('elevated')`,
   `ctx.ui('focusGutter')`), never hard-coded hex in components. Meaning never rides on colour alone.
   Read [references/theming.md](references/theming.md) for themes, shell themes, BCSS, and contrast.
5. **Add motion only where it clarifies a change**: springs and tweens via `animate()` and `timeline()`, page
   transitions via the framed app's `transition`. Static and pipe show the final state.
   Read [references/motion-graphics.md](references/motion-graphics.md) for animation, shaders, raster text,
   and viz.
6. **Prove every mode.** Render each new view in `interactive`, `static`, `pipe`, and `accessible` with
   `createTestContext({ mode })`, and drive behaviour with `runScript` or `testRuntime`. Read
   [references/modes-i18n-testing.md](references/modes-i18n-testing.md) for mode detection, localization,
   right-to-left layout, testing, and recording.

Done means: the app type-checks under the repo's strict config, each view reads correctly in all four modes,
colours come from tokens, and tests drive the behaviour without mocks.

## Inside the Bijou repository

- Read `AGENTS.md` first: Git rules, Code Dojo gates (150 lines / 12000 bytes per `.ts` file, strict ESLint with
  no `any`, no non-null assertions, no unsafe assertions, no mocks), and the design vocabulary.
- Use the canonical terms from `docs/topics/design-vocabulary.md`: Component, Block, Surface, family, variant,
  section, and the four output modes. Document families with the R52 fields in order.
- Check your work with `npx tsc --noEmit -p tsconfig.code-standards.json`, `npm run lint`, focused `vitest`
  runs, and `npm run audit:components -- --all --check` when you change a component.
- Browse real usage: `npm run components` (the Components Library, one component per slide in every mode),
  `npm run dogfood` (the documentation app), `npm run app-frame` (a framed-app reference), `examples/`.
