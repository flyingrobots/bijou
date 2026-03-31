# RE-006 — Formalize Component Layout and Interaction Contracts

Legend: [RE — Runtime Engine](/Users/james/git/bijou/docs/legends/RE-runtime-engine.md)

## Idea

Give components explicit runtime contracts for layout, overflow, and interaction participation.

## Why

Retained layouts and layout-driven routing only work if components can say:

- how they size and align
- how they handle overflow
- whether and how they accept input
- what commands and effects they can emit

## Likely scope

- define component layout rules
- define component interaction metadata on layout nodes
- define command/effect emission contracts
- identify which existing component families should migrate first
