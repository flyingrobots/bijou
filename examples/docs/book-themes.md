# DOGFOOD book themes

The default **Bijou Book** shell has dark and light modes. Change modes in the
existing shell-theme settings. The previous neutral DOGFOOD theme and six
alternate palettes remain available.

The reference is the companion teaching book's `book/preamble.tex`:

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

## ASCII noise backdrop

The title screen uses a fixed-seed, three-octave 3D gradient-noise field inspired
by [PerlinASCII](https://github.com/Koalhack/PerlinASCII/tree/076e3c0f7990b4fc343d2a56fc4eaa4c19f0eda0).
Character density carries the pattern; a single quiet foreground is sampled from
the active theme’s decorative ramp over its explicit background. Terminal cell
aspect ratio, existing quality tiles and quantized animation time are preserved.
The field is decorative; panels and navigation retain their semantic text colors.

The title/backdrop hierarchy uses contrast constraints: decorative ink stays at
or below 1.45:1 against the page, tapering to 1.08:1 in a soft ellipse behind the
cylinder. The active theme supplies every color. Letter strokes use the full
logo palette rather than fading toward the page; depth changes their palette
position. Book-mode tests verify at least 6:1 stroke contrast across sampled
rotation phases. These are software color measurements for the illustration,
not a general accessibility certification for raster lettering.
