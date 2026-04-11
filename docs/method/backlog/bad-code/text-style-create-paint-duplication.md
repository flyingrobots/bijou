# text-style.ts create/paint duplication

## Location

`packages/bijou-tui/src/css/text-style.ts`

## Concern

`createStyledTextSurfaceWithBCSS` and `paintStyledTextSurfaceWithBCSS` share ~90%
identical code (token resolution, packed fast path check, grapheme loop, cell writing).
The `paint` variant delegates to `create` when the surface needs allocation but
duplicates the entire repaint body for the in-place case.

Any bug fix in one function must be manually mirrored in the other.

## Context

The duplication was introduced in 4.4.0 as part of the zero-alloc framed app render
loop work. The `paint` function exists to repaint an existing surface in-place without
allocating a new one.

## Suggested resolution

Extract the shared fill-and-write-graphemes logic into a private helper that both
`create` and `paint` call, passing the target surface as a parameter.
