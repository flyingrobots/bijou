# `kbd()`

Local inline shortcut cues for nearby actions and instructions.

![demo](demo.gif)

## Run

```sh
npx tsx examples/kbd/main.ts
```

## Use this when

- a local action needs a compact shortcut hint
- the keys belong right next to the instruction or control they affect
- a shell-wide help surface would be too heavy for the moment

## Choose something else when

- choose shell help or a command reference when the user needs a broader keymap
- avoid scattering shortcut chips everywhere until they become decorative clutter
- avoid making the chip itself carry the only meaning; the surrounding action text should still be clear

## What this example proves

- single-key, arrow-key, and chord-style shortcut cues
- `kbd()` as inline support for nearby actions
- shortcut chips that stay secondary to the action label they explain

[← Examples](../README.md)
