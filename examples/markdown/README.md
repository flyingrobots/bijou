# `markdown()`

Renders bounded markdown prose that lowers honestly across rich, pipe, and accessible output modes.

## Run

```sh
npx tsx examples/markdown/main.ts
```

Pipe mode output (no ANSI styling):

```sh
npx tsx examples/markdown/main.ts | cat
```

## Use this when

- the content is help, reference, release notes, or bounded prose
- headings, lists, links, and code fences materially help comprehension
- the same text should remain readable in rich terminals, pipes, and accessible output

## Choose something else when

- the content needs deep document navigation instead of one rendered block
- the app is really composing UI layout, forms, or command surfaces
- browser-grade markdown fidelity or arbitrary rich user-authored documents are expected

## What this example proves

- supported markdown structure rendered in a terminal-friendly way
- graceful lowering from styled terminal prose to plain pipe output
- pairing `markdown()` with `box()` to frame a bounded document region honestly

[← Examples](../README.md)
