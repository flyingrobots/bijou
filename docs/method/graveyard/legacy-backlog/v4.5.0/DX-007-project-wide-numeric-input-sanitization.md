# DX-007 — Project-Wide Numeric Input Sanitization

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Idea

Audit all public API functions that accept numeric parameters and ensure
they guard against `NaN`, `Infinity`, `-Infinity`, and fractional values
where integers are expected.

The v4.4.0 data-viz review found several places where non-finite user
input propagated silently into rendering logic. The fixes were targeted
(sparkline, braille-chart, stats-panel), but the same class of bug
likely exists in other components.

## Approach

1. Grep for all exported functions with `number` parameters
2. Classify: which accept user-supplied values vs internal-only
3. Add `Number.isFinite` guards or `Math.floor` clamping at boundaries
4. Consider a shared `sanitizeNumericInput(n, fallback)` utility
5. Add edge-case tests for each affected function

## Why

Three separate review passes (2 self-reviews + CodeRabbit) all found
NaN/Infinity bugs. This is a systemic gap, not a one-off.
