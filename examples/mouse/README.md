# mouse

Mouse event inspector showing clicks, releases, scrolls, and drags with modifier keys.

## Run

```sh
npx tsx examples/mouse/main.ts
```

## Source

```ts
run(app, { mouse: true });

// In update:
if (isMouseMsg(msg)) {
  // msg.button: 'left' | 'middle' | 'right' | 'none'
  // msg.action: 'press' | 'release' | 'move' | 'scroll-up' | 'scroll-down'
  // msg.col, msg.row: 0-based terminal coordinates
  // msg.ctrl, msg.alt, msg.shift: modifier keys
}
```
