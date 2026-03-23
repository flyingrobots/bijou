# Docs Preview

First Learn by Touch slice: a story-driven docs surface built with Bijou itself.

## Run

```sh
npx tsx examples/docs/main.ts
```

Mouse is enabled for this preview. Click a pane to focus it and use the wheel to scroll long docs or help content.

## What it proves

- `ComponentStory` v0 can hold structured teaching fields instead of one markdown blob
- the docs pane and demo pane both derive from the same story record
- profile switching is part of the experience, not an afterthought
- a small framed shell is enough to start building living docs without inventing a second platform first

## Included stories

- `alert()` for in-flow status and straightforward graceful lowering
- `modal()` for structured overlay doctrine and TUI interruption
- `viewportSurface()` for width-sensitive masking and overflow behavior

## Keys

- `↑` / `↓`: move between stories
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

[← Examples](/Users/james/git/bijou/examples/README.md)
