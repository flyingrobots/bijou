# DOGFOOD App Notes

If you are trying to learn Bijou, start with
[../../docs/DOGFOOD.md](../../docs/DOGFOOD.md). This file is the
implementation-facing note for the current DOGFOOD app surface.

First DOGFOOD slice: a story-driven docs surface built with Bijou itself.

## Run

```sh
npm run dogfood
```

For the standalone BlockLab development and testing workbench, run:

```sh
npm run blocklab
```

For a text-first BlockLab index and capture matrix over the same DOGFOOD story catalog, run:

```sh
npm run blocklab:index
```

You now land on a dedicated full-screen title screen first: the app renders a
procedural stacked sine-wave wake through the landing background shader, then
uses [assets/Bijou.svg](../../assets/Bijou.svg) as a background-transparent glyph
mask in complementary colors. The landing screen keeps the treatment sparse:
the V7 title art, a centered `Press [Enter]` cue, the
[assets/flyingrobotslogo.txt](../../assets/flyingrobotslogo.txt) wordmark, and a
reserved last-line footer for quit/continue guidance plus the Bijou version. The
Bijou and FlyingRobots title marks share the same opposite-foreground overlay
treatment. The FlyingRobots Braille wordmark keeps blank asset cells transparent,
and visible Braille cells also use the visible wake color as their background so
dot holes do not fall back to terminal dark.

On the landing screen only, `1-5` switch between palette presets and `←` / `→` cycle themes. Backtick toggles the shared shell perf HUD in place, `Esc` or `q` quit immediately there, and any other unmodified key enters the docs shell.

Mouse is enabled for this preview. In the docs shell, click a pane to
focus it and use the wheel to scroll long docs or help content.

## What it proves

- `ComponentStory` v0 can hold structured teaching fields instead of one markdown blob
- a landing page and a documentation shell can both be driven from the same story substrate
- the same story substrate can also produce a standalone BlockLab workbench and deterministic capture matrix
- the docs shell can carry both prose guides and the component explorer
- the docs pane and preview pane both derive from the same story record once you enter the `Components` section
- profile switching is part of the experience, not an afterthought
- a framed shell can present both top-level docs sections and a rich component browser without pretending those are the same thing
- the docs shell now chooses explicit `wide`, `standard`, `narrow`, and `tiny` layout variants so terminal resize remains a product decision instead of only geometry recomputation
- DOGFOOD can now publish repo orientation, package docs, and release docs inside the same shell

## Included story families

- feedback, overlays, viewport masking, forms, navigation, data visualization, shell composition, and motion/shader effects
- the dense-comparison story demonstrates every `table()` visual variant,
  every explicit pipe serialization, and the keyboard-owned
  `navigableTableSurface()` path
- `motion-and-shader-effects` now covers quad shader waves, Braille fields, glyph-fit raytracing, and spring/timeline orchestration across rich, static, pipe, and accessible profiles

## Keys

- `Enter`: enter the docs from the landing page
- `Esc` / `q`: quit from the landing page
- `↑` / `↓`: cycle landing-screen quality modes before entering the docs
- `1` `2` `3` `4` `5`: switch landing-screen theme presets
- `←` / `→`: cycle landing-screen themes
- `[` / `]`: move between top-level docs sections
- `?`: open keyboard help
- `/`: search component stories and documentation pages in the standard shell search surface
- `F2`: open the standard shell settings drawer
- Backtick: toggle the standard shell performance HUD
- `↑` / `↓`: move through the focused pane's rows
- `Enter` / `Space`: open the focused guide, expand a family, select a component, or activate the focused row
- `←` / `→`: collapse or expand the focused family on the left lane inside `Components`
- `Tab` / `Shift+Tab`: move focus between panes
- `j` / `k`: scroll the focused docs or demo pane
- `d` / `u`: page the focused docs or demo pane
- `1` `2` `3` `4`: switch rich, static, pipe, and accessible profiles
- `,` / `.`: previous or next story variant inside `Components`
- `?`: open or close keyboard help
- `q` / `Esc`: open the standard quit-confirm modal

## Notes

- This is intentionally smaller than the existing showcase. It is a living docs product in progress, not yet the final reference.
- The docs are the demo: the page text and preview are generated from the same structured story data.
- The title screen is deliberately sparse rather than fully blank. It keeps only the entry prompt and brand marks on top of the shader treatment.
- The `Guides`, `Packages`, `Philosophy`, and `Release` sections are no longer just shell shape. They now publish real corpus pages inside the app, and the release-facing smoke contract now runs through DOGFOOD instead of the broad examples tree.
- The docs shell already exposes shell-level search through the standard frame command palette, so users can jump straight to matching guides or component stories instead of walking every list manually first.
- `npm run blocklab` opens a standalone interactive component development and testing workbench over the story catalog.
- `npm run blocklab:index` exposes the story catalog as a deterministic text-first workstation for agents, CI, and future MCP or block tooling. `npm run storybook`, `npm run storybook:index`, and `npm run dogfood:storybook` remain as compatibility aliases during the rename window.
- DOGFOOD now also uses the standard shell-owned settings drawer, so `F2`, the command palette, or shell-level frame bindings can toggle visible preferences like footer control hints and landing quality without the docs app shipping its own overlay plumbing.
- Landing quality is adjustable directly from the landing screen too, so users can see the effect before they ever leave the title treatment.
- The docs shell uses explicit responsive layout variants: wide keeps navigation, content, and metadata/variant context visible; standard and narrow fold secondary panes; tiny renders one useful content pane instead of a crushed multi-column surface.
- Settings rows now carry real secondary descriptions, toggles render with checkbox-style `☐` / `☑` affordances, and choice rows use a distinct cycling marker so the drawer reads like a product settings surface instead of a plain text list.
- Focus now owns input in the explorer: the family lane handles browse/expand keys only while it is active, the variants lane can own arrow-key variant changes, and pane clicks or `Tab` move that ownership through the standard frame shell instead of letting inactive lanes keep responding.
- The footer is now the truthful control surface for the explorer: shell cues stay visible, active-pane hints only appear when they can actually do something, and stale in-pane legends no longer linger under shell overlays or focus changes.
- When no component is selected, the center lane now acts as an onboarding surface: it introduces Bijou itself and explains how to browse, search, configure, and navigate the docs before the user opens a component.
- The explorer workspace now keeps a one-cell gutter around and between the three major columns so the shell chrome and pane rails do not feel visually chopped off at the frame edges.

[← DOGFOOD](../../docs/DOGFOOD.md)
