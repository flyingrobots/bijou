# Showcase

Interactive component explorer with live previews across rich, pipe, and accessible modes.

## Run

```sh
npx tsx examples/showcase/main.ts
```

## Preview Contract

Each showcase entry may now return either:

- a styled `string` preview
- a structured `Surface` preview

The showcase tri-mode renderer lowers that preview once per mode panel:

- rich previews keep structured `Surface` composition where available
- pipe previews still render as plain text
- accessible previews still render in explicit text form

Use a `Surface` preview when the component being demonstrated is already surface-native and the example should keep that structure intact. Keep string previews for examples that are intentionally teaching text-first output.

## Notes

- The badge preview now uses structured surface composition instead of lowering each badge individually.
- The showcase still presents all three modes side by side so degradation behavior stays visible.

[← Examples](/Users/james/git/bijou/examples/README.md)
