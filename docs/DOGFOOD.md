# DOGFOOD

_Documentation Of Good Foundational Onboarding and Discovery_

DOGFOOD is the canonical human-facing docs surface and proving ground for the
Bijou engine.

## Run
```bash
npm run dogfood
```

DOGFOOD initializes its language through the host locale adapter and then lets
users change the preferred language from the Settings drawer (`F2`). The docs
app consumes this through a locale port rather than reading process state from
view code, so localization remains behind the same hexagonal boundary as the
rest of the host integration.

To inspect and enforce the current source-level localization debt:
```bash
npm run dogfood:i18n:debt
```

That report counts remaining localizable DOGFOOD UI strings by source surface.
It is a source inventory, not a rendered-output scraper, so ids, paths, and
catalog-backed fallback calls stay separate from visible raw copy.

DOGFOOD's catalog source is a committed CSV string table:

```text
examples/docs/i18n/source/dogfood-strings.csv
```

Build the selected-locale runtime JSON catalog files from that table with:
```bash
npm run dogfood:i18n:build
npm run dogfood:i18n:check
```

The generated runtime files live under:

```text
examples/docs/i18n/catalogs/<locale>/<namespace>.json
```

DOGFOOD loads the generated English catalog as an explicit production fallback,
then loads only the selected locale directory at runtime. The generated catalog
for `fr`, for example, carries French values only. English source values remain
in the source table and the generated English catalog, not every translated
payload.

In non-production builds, missing selected-locale strings render as a bright
missing-localization marker instead of quietly falling back to English. That
keeps untranslated UI visible while development is running.

The same source table can also be exported through the i18n workbook adapters
instead of requiring translators to edit the docs app source directly:
```bash
npm run dogfood:i18n:export -- --locale fr --format csv
npm run dogfood:i18n:export -- --locale fr --format tsv --out /tmp/dogfood-fr
npm run dogfood:i18n:export -- --format json --bundle /tmp/dogfood-catalog.json
npm run dogfood:i18n:coverage
```

The CSV/TSV and JSON conversions are produced by `@flyingrobots/bijou-i18n-tools`;
DOGFOOD still loads generated runtime catalog JSON rather than parsing
spreadsheet files during rendering.

For the standalone Storybook-style development and testing workbench:
```bash
npm run storybook
```

For the deterministic text-first story index and capture matrix:
```bash
npm run storybook:index
```

## Purpose

DOGFOOD is where Bijou proves its architectural integrity by building itself.
It is not an example; it is the repository's living docs application.

It gathers the package guides for the published workspace, release guidance,
and the doctrine, architecture, invariants, and design-system guidance that
operators need when learning or validating Bijou.

### Today's Proof Points
- **Shell Integrity**: Testing the framed shell, tabs, and pane focus in a production-grade surface.
- **Documentation Jump Search**: `/` opens a global documentation search that
  can jump across sections, activate the right page, and select the matching
  guide or component story.
- **Component Explorer**: A live, interactive field guide to every component family.
- **Blocks Section**: A first-class Blocks lane covering block purpose,
  authoring, first-party blocks, live surface-backed previews, and lowering
  posture.
- **Locale Preference**: The Settings drawer can switch DOGFOOD's preferred
  language after startup, while startup itself uses the host locale adapter.
- **Localization Debt Ratchet**: `npm run dogfood:i18n:debt` counts remaining
  localizable source strings by DOGFOOD surface and fails when the baseline
  increases.
- **Storybook Workstation**: A standalone interactive story browser plus deterministic story index and matrix capture path over the same DOGFOOD story catalog.
- **Graceful Lowering**: Verifying that documentation renders correctly across `rich`, `static`, `pipe`, and `accessible` modes.
- **Responsive Product Layout**: Proving that resize is not enough by selecting `wide`, `standard`, `narrow`, and `tiny` docs layouts that keep constrained terminals useful.
- **Motion and Shader Surfaces**: Exercising canvas, glyph-fit raytracing, transitions, springs, and timelines from the docs app itself.
- **Design Language**: Defining and enforcing the project's visual and interactive standards.

### Relationship to Examples
The `examples/` tree contains isolated reference material and API proofs. **DOGFOOD** is the primary entry point for understanding the system's unified behavior.

---
**DOGFOOD implementation lives in `examples/docs/`.**
