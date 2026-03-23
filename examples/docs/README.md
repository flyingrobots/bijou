# Docs Preview

First Learn by Touch slice: a story-driven docs surface built with Bijou itself.

## Run

```sh
npx tsx examples/docs/main.ts
```

You now land on a dedicated full-screen title screen first: an animated shader composition built from [assets/bijou.txt](/Users/james/git/bijou/assets/bijou.txt), [assets/background.txt](/Users/james/git/bijou/assets/background.txt), and the FlyingRobots wordmark assets in [assets/flyingrobots-wide-large.txt](/Users/james/git/bijou/assets/flyingrobots-wide-large.txt) and [assets/flyingrobots-wide-small.txt](/Users/james/git/bijou/assets/flyingrobots-wide-small.txt). The landing screen keeps the treatment sparse: the animated BIJOU mark, a centered `Press [Enter]` cue, the FlyingRobots wordmark, and the copyright line.

On the landing screen only, `1-5` switch between palette presets and `←` / `→` cycle themes.

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
- `1` `2` `3` `4` `5`: switch landing-screen theme presets
- `←` / `→`: cycle landing-screen themes
- `↑` / `↓`: move through the family/story rows in the left lane
- `Enter` / `Space`: expand a family or select a component
- `←` / `→`: collapse or expand the focused family
- `Tab` / `Shift+Tab`: move focus between panes
- `j` / `k`: scroll the focused docs or demo pane
- `d` / `u`: page the focused docs or demo pane
- `1` `2` `3` `4`: switch rich, static, pipe, and accessible profiles
- `,` / `.`: previous or next story variant
- `?`: open or close keyboard help
- `q`: quit

## Notes

- This is intentionally smaller than the existing showcase. It is the first story-driven docs slice, not the final docs product.
- The docs are the demo: the page text and preview are generated from the same structured story data.
- The title screen is deliberately sparse rather than fully blank. It keeps only the entry prompt and brand marks on top of the shader treatment.
- The left and right rails are intentionally symmetric. The center lane keeps the extra space so the docs and live preview remain the primary reading surface.

[← Examples](/Users/james/git/bijou/examples/README.md)
