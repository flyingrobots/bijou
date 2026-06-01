# DX-125 - Day Zero Onboarding Bridge

Linked issues: #125, #130, #131, #132, #154, #155, #165, #166

Linked legends:

- [DX - Developer Experience](../legends/DX-developer-experience.md)
- [DF - DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

## Sponsor Human

A first-time TypeScript reader who wants to see useful output quickly, then
learn the next app shape without reverse-engineering DOGFOOD.

## Sponsor Agent

A code-generation agent that needs public docs to explain package boundaries,
Surface/TEA/Cmd concepts, render tradeoffs, and the right next guide without
hidden repo memory.

## Hill

The README moves from first visible output to a small framed app path before
asking readers to absorb the full architecture or DOGFOOD implementation.

## Scope

- Move GUIDE and documentation map discovery near the top of README.
- Explain the first app imports by package boundary.
- Stage Surface, App, Msg, Cmd, and framed-shell concepts.
- Add `npm run app-frame` as an intermediate command.
- Add a framed app tutorial that teaches header, status, navigation, detail,
  overlay, and shell commands with the compact existing example.
- Document package split and render-pipeline tradeoffs where readers encounter
  those concepts.

## Playback Questions

1. Can a reader reach visible output from the README without first reading
   architecture docs?
2. Can the same reader find GUIDE and the docs map before scrolling deep into
   the README?
3. Is there a clear path from counter to a framed app before DOGFOOD?
4. Do docs explain why package imports are split?

## Accessibility / Assistive Reading Posture

The bridge uses short sections, tables, and command blocks so readers can scan
for the next action. It avoids requiring long prose before the first command.

## Localization / Directionality Posture

No runtime localization changes. Documentation text remains English.

## Agent Inspectability / Explainability Posture

The public README, GUIDE, docs map, package development guide, and render
pipeline guide carry the explanation agents need to generate correct examples.

## Linked Invariants

- First value should appear before deep architecture.
- DOGFOOD remains the canonical docs app, but it is not the first learning step.
- Package boundaries should be explained at the point of first import.

## Decisions

- Keep `npm run hello` as the lowest-friction first visible output.
- Keep `npm run counter` as the first interactive app.
- Add `npm run app-frame` between counter and DOGFOOD.
- Do not make DOGFOOD smaller; teach the bridge before DOGFOOD.

## Verification

- `npm run docs:inventory`
- `npm test -- --run scripts/docs-preview.test.ts`
- manual playback of `npm run hello`, `npm run counter`, and `npm run app-frame`
  when validating the final PR.

## Tests To Write First

- Docs preview coverage for changed docs surfaces.
- Docs inventory for new guide links.

## Retrospective

See [WF-122 day zero audit fixes](../method/retro/WF-122-day-zero-audit-fixes.md).
