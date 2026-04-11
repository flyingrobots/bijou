# v4.5.0 — Hardening Release

Hardening release focused on systemic input validation, the long-deferred
i18n catalog loader, and DOGFOOD depth.

## Shaped scope

- **DX-007 + DX-008** — project-wide numeric input sanitization audit
  and shared sanitize wrapper. Close the NaN/Infinity class of bug.
- **LX-010** — built-in i18n catalog loader (ASAP since v4.1.0)
- **RE-022** — export public `isPackedSurface` type guard
- **DF-020** — deepen DOGFOOD story depth and variant quality
  (mode-aware lowering for data-viz, retire more examples)
