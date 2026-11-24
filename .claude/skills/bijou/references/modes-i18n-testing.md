# Output modes, localization, testing, and recording

Sources: `packages/bijou/src/core/detect/tty.ts`, `packages/bijou/src/core/mode-render.ts`, `packages/bijou-i18n/`,
`packages/bijou-tui/src/app-frame-i18n.ts`, `packages/bijou/src/adapters/test/`, `packages/bijou-tui/src/driver-*.ts`.

## Output modes

| Mode | Promise | Selected when (first match wins) |
| --- | --- | --- |
| `accessible` | plain, linear text a screen reader can follow top to bottom | `BIJOU_ACCESSIBLE=1` |
| `pipe` | plain text, no escape codes, no cursor movement | `TERM=dumb`, or stdout is not a TTY |
| `static` | one honest frame (CI logs) | `CI` is set |
| `interactive` | the full TUI with motion | otherwise |

NO_COLOR is not a mode: it removes colour and keeps the TUI.

**Lowering:** every component keeps its meaning in each mode (interactive and static draw rich output, pipe writes
plain or tabular text, accessible states things in words). For your own primitives use
`renderByMode(ctx.mode, { interactive, static, pipe, accessible })`; missing branches fall back
(visual modes try interactive, static, pipe, accessible; text modes try pipe, accessible, interactive, static).
Every branch carries the same meaning; only presentation differs.

## Localization and right-to-left layout

- Runtime: `createI18nRuntime({ locale, direction: 'ltr'|'rtl', catalogs, fallbackLocale? })` with `t({ namespace,
  id }, values)`, `setLocale(locale, direction?)`, `loadCatalog`. A catalog is
  `{ namespace, entries: [{ key, kind: 'message'|'resource'|'data', sourceLocale, values }] }`.
- Framed apps take `i18n` and localize their own chrome (`frameMessage`). Direction mirrors the drawer anchor and
  the notification stack; mirroring the rest of your layout (breadcrumbs, tab order, alignment) is the app's job.
  Code, function names, and components' own output are not mirrored.
- Keep visible copy in catalogs, not string literals, and translate article bodies as well as chrome: a translated
  shell around English content reads as broken. In the Bijou repo, DOGFOOD's strings live in
  `examples/docs/i18n/source/dogfood-strings.csv` (rebuild catalogs with `npm run dogfood:i18n:build`), and
  translated articles in `examples/docs/content/i18n/<locale>/<guide id>.md`.

## Testing

- Context: `createTestContext({ mode, runtime: { columns, rows }, theme?, clock?, noColor?, style? })` from
  `@flyingrobots/bijou/adapters/test`; `mockClock({ nowMs })` gives `advanceBy(ms)`, `runAll()`.
- Render a component in each mode and assert on text: `surfaceToString(surface, ctx.style)` or the string forms.
- Drive an app: `runScript(app, steps, { ctx, css?, onFrame?, pulseFps? })` with steps `{ key }`, `{ pulse: { dt } }`,
  `{ resize }`, `{ mouse }`, `{ msg }`; or `testRuntime(app)` for an interactive harness (`press`, `pulse`,
  `resize`, `frame`, `model`). `runScript` drains every command before the next step, so a command that sleeps on a
  mock clock blocks it: run such commands detached (start them, deliver their message when they settle).
  Each recorded frame (`frames[i]`, the `onFrame` frame, a snapshot's `frame`) is a snapshot of that update, so any
  frame can be read, not only the last.
- Bijou repo standards: vitest; no mocks (`vi.mock`, `spyOn` are banned: use in-memory fakes and observable
  behaviour); write the failing test first; frame tests with `npm run test:frames`.

## Recording

`examples/hero/clip.ts` `recordClip(app, clipCtx, { seconds, fps, keys: [[sec, key]], css })` drives a real app on a
mock clock and returns one frame per pulse. `examples/hero/encode.ts` `openRecording(out, delayCs, cols, rows)`
streams frames to the encoder port (`examples/hero/encoders/`), whose adapters write MP4 (ffmpeg), animated WebP
(img2webp, `brew install webp`), or GIF (gifenc, 256 colours per frame) by extension. Text is drawn in JetBrains
Mono. Scripts: `npm run record:hero`, `npm run record:components`.
