# DOGFOOD book themes

The default **Bijou Book** shell has dark and light modes. Change modes in the
existing shell-theme settings. The previous neutral DOGFOOD theme and six
alternate palettes remain available.

The shell-theme picker, mode descriptions, Theme Lab and Inspector use the
app's active locale, including changes made while the app is running. Separate
apps keep independent locales; changing language preserves theme identity and
colors. Runtime regressions cover English, German, Spanish and French through
the actual picker and rendered panels.

The reference is the companion teaching book's
[pinned preamble](https://github.com/flyingrobots/bijou-job-monitor/blob/209732eeb17315892df25f4546ccb40d92bd3240/book/preamble.tex#L14-L18):

| Book role | Reference |
| --- | --- |
| Coral | `#F7685F` |
| Ink | `#2D2726` |
| Heading | `#83312C` |
| Muted ink | `#645452` |
| Rose panel | `#FFEDEB` |

Dark mode uses warm charcoal surfaces, rose text and the exact coral accent.
Light mode uses rose paper, the exact ink and the darker wine heading color for
readable accents. Bright coral remains a brand reference; it is not assumed to
pass body-text contrast on pale paper. Status colors keep separate semantic
roles, with labels/icons still conveying meaning.

Reference colors feed semantic roles through an inspectable token graph. The
landing renderer receives the selected shell's visual theme explicitly, so
switching modes also changes its background and invalidates its frame cache.
Footer and prompt roles use readable semantic colors instead of muted positions
in a decorative ramp.

`tests/dogfood-book-theme.test.ts` checks registration, the actual landing
surface, mode-cache invalidation, every semantic foreground against each of the
five surfaces (at least 4.5:1), and primary/muted borders and scroll tracks
(at least 3:1). Those checks establish software sRGB contrast. They do not prove
color-vision-deficiency discrimination, physical terminal palette calibration or
human accessibility. Existing lower-mode/navigation checks remain relevant.

The cylinder title is tracked separately in #502; this theme pair does not
require it, the unfinished color generator, or a native renderer. The book and
its archived source corpus are unchanged.

## Rendered evidence

The retained [measurements](../../docs/releases/8.0.0/book-theme-evidence/measurements.json)
and [raw scene data](../../docs/releases/8.0.0/book-theme-evidence/scenes.json)
identify source commit `32443ea26ffba95624dcd9916905764543dd1c52`.
The test adapter selected modes through F2/Down/Enter/F2; landing scenes use the
selected model with the landing route and time zero. Twenty scene samples cover
interactive 120×40 and 64×20 layouts plus static, pipe and accessible 120×40
layouts. These samples do not establish behavior at every terminal size.

| Mode | Minimum of 35 semantic/surface pairs | Minimum of 15 border/track pairs |
| --- | ---: | ---: |
| Dark | 4.73:1 | 4.75:1 |
| Light | 5.56:1 | 4.77:1 |

The independent calculation uses linearized sRGB relative luminance from the
compiled theme colors. The border/track sample covers primary and muted borders
and scroll tracks. The existing safe-pair diagnostic covers the remaining
configured chrome roles.

Representative software cell renderings:

- [Dark landing](../../docs/releases/8.0.0/book-theme-evidence/book-dark-landing.svg)
- [Light landing](../../docs/releases/8.0.0/book-theme-evidence/book-light-landing.svg)
- [Dark Theme Lab](../../docs/releases/8.0.0/book-theme-evidence/book-dark-theme-lab.svg)
- [Light Theme Lab](../../docs/releases/8.0.0/book-theme-evidence/book-light-theme-lab.svg)

The SVGs retain captured glyphs and foreground/background colors with a
monospace font. They omit text modifiers and are not physical terminal captures.
The ornamental animation is outside the semantic text-contrast measurement.
