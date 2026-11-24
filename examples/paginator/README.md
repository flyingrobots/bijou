# `paginator()`

Page indicators (dots and text)

![demo](demo.gif)

## Run

```sh
npx tsx examples/paginator/main.ts
```

## Use this when

- compact position-in-sequence feedback is enough
- the user benefits from seeing current page and total count without a richer navigation surface
- the sequence is genuinely bounded

## Choose something else when

- choose `tabs()` when the user is switching among peer destinations
- choose `stepper()` when the sequence is a staged process rather than plain pagination
- choose a list or summary label when the content is effectively unbounded and page counts would mislead

## Right-to-left layout

Pass `direction: 'rtl'`, or create the context with `direction: 'rtl'`. In `interactive` and `static`
output the dots run right to left: page one is rightmost, and the next page is to the left of the
current one. The `text` style (`Page 2 of 4`), `pipe` (`[2/4]`) and `accessible` output keep their
digits and reading order. The dots are symmetric, so no glyph is mirrored.

## What this example proves

- `paginator()` in dot and text variants
- lightweight page-position feedback instead of full navigation chrome
- clean textual lowering of bounded-sequence state

[← Examples](../README.md)
