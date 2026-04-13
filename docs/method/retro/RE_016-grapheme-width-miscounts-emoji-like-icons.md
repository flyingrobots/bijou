---
title: RE-016 — graphemeWidth Miscounts Emoji-Like Icon Characters
lane: retro
legend: RE
---

# RE-016 — graphemeWidth Miscounts Emoji-Like Icon Characters

## Disposition

Fixed on `release/v4.5.0` in commit `69291fa`. First-party status icon paths now force text presentation with VS15 in core alerts, notes, overlay toasts, and notifications, and the grapheme regression coverage proves those symbols stay in the narrow text-width lane instead of drifting into emoji-width rendering.

## Original Proposal

## Summary

`graphemeWidth()` in `packages/bijou/src/core/text/grapheme.ts` counts
certain Unicode icon characters as 1 column wide, but many renderers
(chat UIs, some terminal emulators, web-based terminals) display them as
2 columns wide. This causes box-drawing alignment to break when these
characters appear inside bordered components.

## Affected Characters

| Char | Codepoint | Name | graphemeWidth | Actual (many fonts) |
|------|-----------|------|---------------|---------------------|
| ✗ | U+2717 | BALLOT X | 1 | 2 |
| ⚠ | U+26A0 | WARNING SIGN | 1 | 2 |
| ℹ | U+2139 | INFORMATION SOURCE | 1 | 2 |

`✓` (U+2713 CHECK MARK) renders as 1-wide in most contexts and is not
affected.

## Symptom

The right border `│` of `alert()` boxes is misaligned for `error`,
`warning`, and `info` variants:

```
┌─────────────────────────────────────┐
│ ✗ Connection refused on port 5432. │   ← right │ doesn't reach ┐
└─────────────────────────────────────┘
```

## Where It Matters

- `alert()` component — uses `ICONS` map with `✗`, `⚠`, `ℹ`
- Any component that places these characters inside a `box()` or
  width-padded cell
- Particularly visible in non-terminal monospace contexts (MCP chat
  output, web terminals, VS Code terminal)

## Files

- `packages/bijou/src/core/text/grapheme.ts` — width calculation
- `packages/bijou/src/core/components/alert.ts` — icon map (line 21-26)

## Options

1. Fix `graphemeWidth()` to handle ambiguous-width characters correctly
   (hard — width depends on the rendering context)
2. Replace the icons with ASCII-safe alternatives in a dedicated
   `plainStyle` / MCP rendering path
3. Add a width-override mechanism so MCP context can declare these as
   2-wide
