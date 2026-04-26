# AUDIT-001 — Mentor Audit of `examples/showcase`

_Expert evaluation of the Bijou Showcase application to ensure adherence to core invariants, hexagonal boundaries, and anti-SLUDGE TypeScript standards._

Legend:
- [HT — Humane Terminal](../../legends/HT-humane-terminal.md)
- [DL — Design Language](../../legends/DL-design-language.md)
- [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Why this cycle exists

The Showcase app is the most visible "complex" implementation of Bijou. If it contains anti-patterns (e.g., hardcoded colors, loose typing, or mixed architectural concerns), it will mislead developers into adopting those same bad habits. 

As the **EXPERT Bijou BigBro**, I must audit this app to:
- Identify and backlog "sludge" for correction.
- Propose refactors that align with the **Hexagonal** and **TEA** pillars.
- Ensure it serves as a "Humane" reference for others.

## Human users / jobs / hills

### Primary human users
- Developers looking at `examples/` for inspiration.
- Maintainers ensuring the library supports complex use-cases cleanly.

### Human jobs
1. Learn how to structure a multi-page TUI app.
2. See "pro-level" Bijou usage.

### Human hill
A developer can read the Showcase source and see a perfect reflection of the **Invariants**—clear boundaries, semantic tokens, and rhythmic layout—without any "clever sludge."

## Agent users / jobs / hills

### Primary agent users
- EXPERT Bijou BigBro (auditor/mentor).

### Agent jobs
1. Audit the `Update` loop for side-effects.
2. Verify `Surface` usage follows performance best practices.

### Agent hill
An agent can mechanically verify that the showcase app never imports a Node.js-specific adapter into its `FramePage` logic.

## Test Plan

### Golden Path (The Audit)
- Scan `examples/showcase/app.ts` for:
    - `any` or `as any`.
    - Hardcoded ANSI or hex strings.
    - Direct `process` or `fs` access.
- Scan `examples/showcase/registry.ts` for:
    - Improper `ctx` propagation.
    - Violation of the 2-cell rhythm.

## Playback Questions
1. Does the showcase app leak "adapter sludge" into its page definitions?
2. Are the message types (`M`) strictly defined or do they use `any`?
3. Is the layout "geometricly lawful" (2-cell rhythm)?

## Linked Invariants
- [The Buffer Holds Facts](../../invariants/buffer-holds-facts.md)
- [Hexagonal Architecture](../../ARCHITECTURE.md)
- [Anti-SLUDGE Policy](../../docs/method/backlog/badcode/bad-code.md)

## Implementation Outline
1. **Research:** Deep-read `app.ts` and `registry.ts`.
2. **Strategy:** Categorize findings into `bad-code` (ASAP/Backlog) and `cool-ideas`.
3. **Execution:** Log findings and propose surgical fixes for the most egregious violations.
