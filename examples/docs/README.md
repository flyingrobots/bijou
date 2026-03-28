# Docs Preview

First DOGFOOD slice: a story-driven docs surface built with Bijou itself.

## Run

```sh
npx tsx examples/docs/main.ts
```

You now land on a dedicated full-screen title screen first: an animated shader composition built from [assets/bijou.txt](/Users/james/git/bijou/assets/bijou.txt), [assets/background.txt](/Users/james/git/bijou/assets/background.txt), and the FlyingRobots wordmark assets in [assets/flyingrobots-wide-large.txt](/Users/james/git/bijou/assets/flyingrobots-wide-large.txt) and [assets/flyingrobots-wide-small.txt](/Users/james/git/bijou/assets/flyingrobots-wide-small.txt). The landing screen keeps the treatment sparse: the animated BIJOU mark, a centered `Press [Enter]` cue, the FlyingRobots wordmark, and a reserved last-line footer for quit/continue guidance plus the Bijou version.

On the landing screen only, `1-5` switch between palette presets and `←` / `→` cycle themes. `Esc` or `q` quit immediately there; any other unmodified key enters the docs explorer.

Mouse is enabled for this preview. In the docs explorer, click a pane to focus it and use the wheel to scroll long docs or help content.

## What it proves

- `ComponentStory` v0 can hold structured teaching fields instead of one markdown blob
- a landing page and a documentation shell can both be driven from the same story substrate
- the docs pane and preview pane both derive from the same story record once you enter the explorer
- profile switching is part of the experience, not an afterthought
- a framed shell can present accordion-style component families, selected component docs, and variant comparisons in a more website-like layout

## Included stories

- `alert()` for in-flow status and straightforward graceful lowering
- `modal()` for structured overlay doctrine and TUI interruption
- `viewportSurface()` for width-sensitive masking and overflow behavior

## Keys

- `Enter`: enter the docs from the landing page
- `Esc` / `q`: quit from the landing page
- `1` `2` `3` `4` `5`: switch landing-screen theme presets
- `←` / `→`: cycle landing-screen themes
- `?`: open keyboard help
- `/`: search components in the standard shell search surface
- `F2`: open the standard shell settings drawer
- `↑` / `↓`: move through the focused lane's rows
- `Enter` / `Space`: expand a family, select a component, or activate the focused row
- `←` / `→`: collapse or expand the focused family on the left lane
- `Tab` / `Shift+Tab`: move focus between panes
- `j` / `k`: scroll the focused docs or demo pane
- `d` / `u`: page the focused docs or demo pane
- `1` `2` `3` `4`: switch rich, static, pipe, and accessible profiles
- `,` / `.`: previous or next story variant
- `?`: open or close keyboard help
- `q` / `Esc`: open the standard quit-confirm modal

## Notes

- This is intentionally smaller than the existing showcase. It is the first story-driven docs slice, not the final docs product.
- The docs are the demo: the page text and preview are generated from the same structured story data.
- The title screen is deliberately sparse rather than fully blank. It keeps only the entry prompt and brand marks on top of the shader treatment.
- The left and right rails are intentionally symmetric. The center lane keeps the extra space so the docs and live preview remain the primary reading surface.
- The docs explorer already exposes shell-level search through the standard frame command palette, so users can jump straight to a component by name instead of walking the family tree first.
- DOGFOOD now also uses the standard shell-owned settings drawer, so `F2`, the command palette, or shell-level frame bindings can toggle visible preferences like footer control hints and landing quality without the docs app shipping its own overlay plumbing.
- Focus now owns input in the explorer: the family lane handles browse/expand keys only while it is active, the variants lane can own arrow-key variant changes, and pane clicks or `Tab` move that ownership through the standard frame shell instead of letting inactive lanes keep responding.
- The footer is now the truthful control surface for the explorer: shell cues stay visible, active-pane hints only appear when they can actually do something, and stale in-pane legends no longer linger under shell overlays or focus changes.
- When no component is selected, the center lane now acts as an onboarding surface: it introduces Bijou itself and explains how to browse, search, configure, and navigate the docs before the user opens a component.
- The explorer workspace now keeps a one-cell gutter around and between the three major columns so the shell chrome and pane rails do not feel visually chopped off at the frame edges.

[← Examples](/Users/james/git/bijou/examples/README.md)
