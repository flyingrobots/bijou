# DOGFOOD

_Documentation Of Good Foundational Onboarding and Discovery_

DOGFOOD is the canonical human-facing docs surface and proving ground for the
Bijou engine.

## Run
```bash
npm run dogfood
```

For the interactive Storybook-style component browser:
```bash
npm run storybook
```

For the deterministic text-first story index and capture workstation:
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
- **Storybook Workstation**: A deterministic story index and matrix capture path over the same DOGFOOD story catalog.
- **Graceful Lowering**: Verifying that documentation renders correctly across `rich`, `static`, `pipe`, and `accessible` modes.
- **Responsive Product Layout**: Proving that resize is not enough by selecting `wide`, `standard`, `narrow`, and `tiny` docs layouts that keep constrained terminals useful.
- **Motion and Shader Surfaces**: Exercising canvas, glyph-fit raytracing, transitions, springs, and timelines from the docs app itself.
- **Design Language**: Defining and enforcing the project's visual and interactive standards.

### Relationship to Examples
The `examples/` tree contains isolated reference material and API proofs. **DOGFOOD** is the primary entry point for understanding the system's unified behavior.

---
**DOGFOOD implementation lives in `examples/docs/`.**
