# DOGFOOD App Notes

If you are trying to learn Bijou, start with
[../../docs/DOGFOOD.md](../../docs/DOGFOOD.md). This file is the
implementation-facing note for the current DOGFOOD app surface.

First DOGFOOD slice: a story-driven docs surface built with Bijou itself.

## Run

```sh
npm run dogfood
```

You now land on a dedicated full-screen title screen first: an animated shader composition built from [assets/bijou.txt](../../assets/bijou.txt), [assets/background.txt](../../assets/background.txt), and the FlyingRobots wordmark assets in [assets/flyingrobots-wide-large.txt](../../assets/flyingrobots-wide-large.txt) and [assets/flyingrobots-wide-small.txt](../../assets/flyingrobots-wide-small.txt). The landing screen keeps the treatment sparse: the animated BIJOU mark, a centered `Press [Enter]` cue, the FlyingRobots wordmark, and a reserved last-line footer for quit/continue guidance plus the Bijou version.

On the landing screen only, `1-5` switch between palette presets and `←` / `→` cycle themes. `Esc` or `q` quit immediately there; any other unmodified key enters the docs shell.

Mouse is enabled for this preview. In the docs shell, click a pane to
focus it and use the wheel to scroll long docs or help content.

## What it proves

- `ComponentStory` v0 can hold structured teaching fields instead of one markdown blob
- a landing page and a documentation shell can both be driven from the same story substrate
- the docs shell can carry both prose guides and the component explorer
- the docs pane and preview pane both derive from the same story record once you enter the `Components` section
- profile switching is part of the experience, not an afterthought
- a framed shell can present both top-level docs sections and a rich component browser without pretending those are the same thing
- DOGFOOD can now publish repo orientation, package docs, and release docs inside the same shell

## Included stories

- `alert()` for in-flow status and straightforward graceful lowering
- `modal()` for structured overlay doctrine and TUI interruption
- `viewportSurface()` for width-sensitive masking and overflow behavior

## Keys

- `Enter`: enter the docs from the landing page
- `Esc` / `q`: quit from the landing page
- `↑` / `↓`: cycle landing-screen quality modes before entering the docs
- `1` `2` `3` `4` `5`: switch landing-screen theme presets
- `←` / `→`: cycle landing-screen themes
- `[` / `]`: move between top-level docs sections
- `?`: open keyboard help
- `/`: search the current docs section in the standard shell search surface
- `F2`: open the standard shell settings drawer
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
- The `Guides`, `Packages`, `Philosophy`, and `Release` sections are no longer just shell shape. They now publish real corpus pages inside the app. The remaining `4.1.0` DOGFOOD work is about demoting the old examples-first posture and moving smoke coverage onto DOGFOOD.
- The docs shell already exposes shell-level search through the standard frame command palette, so users can jump straight to the current section's content instead of walking every list manually first.
- DOGFOOD now also uses the standard shell-owned settings drawer, so `F2`, the command palette, or shell-level frame bindings can toggle visible preferences like footer control hints and landing quality without the docs app shipping its own overlay plumbing.
- Landing quality is adjustable directly from the landing screen too, so users can see the effect before they ever leave the title treatment.
- Settings rows now carry real secondary descriptions, toggles render with checkbox-style `☐` / `☑` affordances, and choice rows use a distinct cycling marker so the drawer reads like a product settings surface instead of a plain text list.
- Focus now owns input in the explorer: the family lane handles browse/expand keys only while it is active, the variants lane can own arrow-key variant changes, and pane clicks or `Tab` move that ownership through the standard frame shell instead of letting inactive lanes keep responding.
- The footer is now the truthful control surface for the explorer: shell cues stay visible, active-pane hints only appear when they can actually do something, and stale in-pane legends no longer linger under shell overlays or focus changes.
- When no component is selected, the center lane now acts as an onboarding surface: it introduces Bijou itself and explains how to browse, search, configure, and navigate the docs before the user opens a component.
- The explorer workspace now keeps a one-cell gutter around and between the three major columns so the shell chrome and pane rails do not feel visually chopped off at the frame edges.

[← DOGFOOD](../../docs/DOGFOOD.md)
