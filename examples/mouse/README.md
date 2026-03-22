# `parseMouse()`, `MouseMsg`

Mouse event inspector for the keyboard-first pointer layer in `@flyingrobots/bijou-tui`.

## Run

```sh
npx tsx examples/mouse/main.ts
```

## Use this when

- you are validating terminal mouse parsing and routing
- you need to inspect clicks, releases, scrolls, drags, and modifiers
- you are designing mouse enhancement for an existing keyboard-first interaction

## Choose something else when

- choose normal component examples when you are evaluating the product pattern itself rather than raw pointer events
- do not treat this as a license to invent pointer-only flows with no keyboard parity

## What this example proves

- `run(app, { mouse: true })` runtime opt-in
- `MouseMsg` shape for buttons, actions, coordinates, and modifiers
- the raw input layer that shell tabs, notifications, and future spatial controls build on

[← Examples](../README.md)
