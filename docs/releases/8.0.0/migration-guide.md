# Migrating to Bijou 8.0.0-rc.1

This is a release candidate. Pin the exact version; do not use a caret range.

```bash
npm install @flyingrobots/bijou@8.0.0-rc.1 \
            @flyingrobots/bijou-node@8.0.0-rc.1 \
            @flyingrobots/bijou-tui@8.0.0-rc.1
```

All workspace packages are versioned in lock-step, so mixing `8.0.0-rc.1` with
`7.2.0` packages is unsupported.

Two breaking changes, both from
[`DX-052`](../../design/DX-052-no-color-is-not-a-capability.md). Neither requires
a code change for most applications; both change what your application *does* in
situations you may not have tested.

## 1. `NO_COLOR` no longer forces `'pipe'` mode

### What changed

`detectOutputMode()` no longer inspects `NO_COLOR`. The detection order is now:

```text
BIJOU_ACCESSIBLE=1  -> 'accessible'
TERM=dumb           -> 'pipe'
!stdout.isTTY       -> 'pipe'
CI                  -> 'static'
stdout.isTTY        -> 'interactive'
```

### Why

`NO_COLOR` is a statement about colour. [no-color.org](https://no-color.org)
specifies that its presence "prevents the addition of ANSI color" and says
nothing about cursor addressing or interactivity. Mapping it to `'pipe'` meant a
user who exported `NO_COLOR=1` in a shell profile — common, and reasonable — lost
the entire TUI rather than only its colour: every component lowered to its
single-frame form, and `shouldUseShellQuitConfirm()` began returning
`'immediate'`.

### What did *not* change

Colour output. `NO_COLOR` is read independently by `createBijou()`,
`createNodeContext()`, and `isNoColor()`, none of which consult the mode. With
`NO_COLOR` set you still get `theme.noColor === true`, `ink()` returning
`undefined`, and `styled()` returning unstyled text.

To be precise about the scope: an interactive session does emit cursor movement,
screen updates, and possibly alternate-screen sequences — it has to, or it is not
a TUI. What `NO_COLOR` suppresses is **colour and style escapes**, which is what
it asks for.

### What you may need to do

**If you relied on `NO_COLOR` to get single-frame output**, say in a script or a
log-capturing harness, it no longer does that. Use whichever is accurate:

```ts
// The terminal genuinely cannot do cursor addressing:
TERM=dumb

// You are capturing output rather than driving a terminal:
//   redirect stdout — a non-TTY stdout still yields 'pipe'

// You want to force it from inside the app:
const ctx = { ...createBijou(ports), mode: 'pipe' as const };
```

**If you set `NO_COLOR` because you wanted a monochrome TUI**, you now get one.
No action needed; this is the fix.

**If you wrote your own detector to work around this** — `git-cas` and `muniment`
both did — you can delete it. Check that your override does not also encode
something else you still want.

## 2. An unknown status key no longer resolves to a struck-through token

### What changed about the fallback

`ctx.status(key)` and `ResolvedTheme.inkStatus(key)` fall back to
`semantic.muted` instead of `status.muted` when `key` is not in the theme.

### Why the fallback moved

`status.muted` carries `['dim', 'strikethrough']` in every shipped preset. That
is reasonable for a token meaning "retired" — and wrong as the answer to "I don't
know this key". Because `status(key)` accepts `string`, a typo, or a key an
application forgot to add to its theme, silently rendered text with a line
through it. A reader sees "cancelled"; the application said nothing of the kind.

The new target matches the sibling `ui()` accessor, which already falls back to
`semantic.primary`.

### What you may need to do about the fallback

**Probably nothing.** `status.muted` and `semantic.muted` share a hex in every
shipped preset, so the only visible difference is the absence of the
strikethrough.

**If you defined a theme where those two tokens have different hexes**, an
unknown key now resolves to the `semantic.muted` hex. Check any custom preset.

**If you were relying on the strikethrough fallback** as a way to spot undefined
keys during development, it is gone. It was never a reliable signal — it only
appeared when a code path actually ran.
[#521](https://github.com/flyingrobots/bijou/issues/521) tracks typing the
accessors so a missing key becomes a compile error instead.

`ctx.status('muted')` itself is unchanged, strikethrough intact.

## 3. Additive: `extendTheme()` reaches all six token groups

Not breaking. `border` and `semantic` join `status`, `ui`, `gradient`, and
`surface`:

```ts
const theme = extendTheme(BIJOU_DARK, {
  status: { guarded: tv('#4cc9c3') },
  border: { primary: tv('#75798d') },     // now possible
  semantic: { accent: tv('#d6c5ff') },    // now possible
});
```

Both are overridable rather than extensible with new keys, because `Theme` fixes
their key sets.

### Why this matters more than it looks

The shipped presets alias heavily across groups. `bijou-dark` uses `#f2c45d` for
`status.warning`, `status.active`, `semantic.warning`, `semantic.accent`,
`ui.cursor`, `ui.focusGutter`, `ui.sectionHeader`, `ui.logo`, `border.secondary`
**and** `border.warning` — ten tokens, one colour. `bijou-light` does the same
with `#7a5200`.

So `extendTheme(BIJOU_DARK, { status })` replaced your statuses and silently kept
that amber for every heading, cursor, and border. If you have done that, your
headings are probably the same colour as your `warning`. That is not hypothetical
— it is how this was found, at ΔE 0.023 in OKLab, which is indistinguishable.

If you override `status`, consider auditing `ui` and `border` too:

```ts
import { doctorTheme } from '@flyingrobots/bijou';
console.log(doctorTheme(myTheme, { maxColorReuse: 2 }));
```

Note that `doctorTheme` checks contrast and reuse but not perceptual separation
under colour-vision deficiency — see
[#520](https://github.com/flyingrobots/bijou/issues/520) — and that the shipped
presets do not currently satisfy it
([#519](https://github.com/flyingrobots/bijou/issues/519)).

## Reporting rc feedback

This candidate exists to find out what these two changes break in real
applications. Please file against
[#518](https://github.com/flyingrobots/bijou/issues/518) or open a new issue with
the `lane:release` label.
