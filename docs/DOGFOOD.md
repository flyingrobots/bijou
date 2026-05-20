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
- **Component Explorer**: A live, interactive field guide to every component family.
- **Blocks Section**: A first-class Blocks lane covering block purpose,
  authoring, first-party blocks, live accordion previews, and lowering posture.
- **Locale Preference**: The Settings drawer can switch DOGFOOD's preferred
  language after startup, while startup itself uses the host locale adapter.
- **Storybook Workstation**: A standalone interactive story browser plus deterministic story index and matrix capture path over the same DOGFOOD story catalog.
- **Graceful Lowering**: Verifying that documentation renders correctly across `rich`, `static`, `pipe`, and `accessible` modes.
- **Responsive Product Layout**: Proving that resize is not enough by selecting `wide`, `standard`, `narrow`, and `tiny` docs layouts that keep constrained terminals useful.
- **Motion and Shader Surfaces**: Exercising canvas, glyph-fit raytracing, transitions, springs, and timelines from the docs app itself.
- **Design Language**: Defining and enforcing the project's visual and interactive standards.

### Relationship to Examples
The `examples/` tree contains isolated reference material and API proofs. **DOGFOOD** is the primary entry point for understanding the system's unified behavior.

---
**DOGFOOD implementation lives in `examples/docs/`.**
