---
title: "TypeScript Code Standards — Editor's Edition™"
date: 2026-06-17
lastmod: 2026-06-17
author:
  name: "James Ross"
  email: "james@flyingrobots.dev"
status: "normative"
---

# TypeScript Code Standards — Editor's Edition™

This is the engineering doctrine for this repository.

The repository is written under one modern assumption: **the codebase will be read, refactored, and written by humans and LLM agents.** Human cleverness is expensive. Agent cleverness is destructive when the system rewards inference, hidden context, or folklore. Therefore this codebase runs on explicit runtime truth, bounded context, deterministic behavior, auditable provenance, and boring infrastructure.

> **Sensei's Wisdom™**  
> A standard without automation is a campfire story. Nice glow. Zero stopping power.

## Scope

These rules apply to hand-written TypeScript source, tests, adapters, scripts, and architecture decisions.

Generated files, vendored code, build output, lockfiles, snapshots, migrations, and third-party API payload declarations may be exempted, but only by path-level configuration. Do not hide normal source code in an exempt directory. That is not architecture. That is laundry under the bed.

## Vocabulary

**Raw data** means untrusted input: JSON, HTTP bodies, environment variables, CLI args, database rows, filesystem bytes, queue messages, browser storage, and third-party SDK output.

**Boundary** means the first trusted code that touches raw data.

**Domain core** means pure application/domain logic. It may depend on ports and domain values. It may not depend on host APIs, clocks, randoms, networks, filesystems, databases, or frameworks.

**Port** means an explicit interface owned by the core that describes a side-effect capability.

**Adapter** means infrastructure code that implements a port using the outside world.

**Fake** means a deterministic in-memory implementation of a port used for tests.

**Mock** means a test double that verifies call choreography instead of observable behavior. Mocks are radioactive unless explicitly exempted.

**Agent** means an automated coding assistant, LLM-driven tool, or scripted process that reads and modifies the repository.

**Graft receipt** means the audit record for an agentic context session: task, bounded reads, bytes consumed, files touched, tripwires, and final patch provenance.

---

## Rule 0: Runtime Truth Wins

When the program is running, only one question matters:

**What is actually true right now, in memory, under execution?**

Types, tests, docs, generated assertions, comments, and agent explanations are secondary. If they disagree with runtime reality, they are lying.

### Non-negotiables

- **No `any` in hand-written code.** Ever. The exception belongs in generated/vendor code only.
- **`unknown` is permitted at trust boundaries.** It must be narrowed, parsed, validated, or rejected before entering the domain core.
- **Unsafe narrowing assertions are banned.** No `value as User`, no `foo as string`, no `as WhateverBecausePleaseCompile`.
- **Safe broadening assertions and `as const` are permitted only when they do not lie about runtime data.**
- **Validation happens at the boundary.** Raw data becomes instantiated, invariant-checked domain values before crossing into the core.
- **No TypeScript gymnastics in domain code.** If a type requires nested conditional, mapped, inferred, or distributive cleverness to understand, it is too clever.

> **Sensei's Wisdom™**  
> Types are promises. Constructors are border control.

### Preferred shape

```ts
export class EmailAddress {
  public readonly value: string;

  public constructor(value: string) {
    if (!value.includes("@")) {
      throw new Error(`Invalid EmailAddress: ${value}`);
    }

    this.value = value;
    Object.freeze(this);
  }

  public static fromUnknown(value: unknown): EmailAddress {
    if (typeof value !== "string") {
      throw new Error("EmailAddress must be a string");
    }

    return new EmailAddress(value);
  }
}
```

### Banned shape

```ts
const email = payload.email as string;
```

That is not validation. That is a blindfold with syntax highlighting.

---

## Rule 1: Agentic Legibility

Agents have finite attention and weak long-range judgment. They fail when behavior is split across hidden configuration, reflection, ambient state, dynamic registration, and “everybody knows” conventions.

The architecture must act as a context governor.

### Non-negotiables

- **Locality of behavior.** If a behavior is modified, the relevant context must be in the same file or in explicit, immediately adjacent imports.
- **No magical dependency injection.** Dependencies are passed explicitly through constructors or functions.
- **No service locators. No global containers. No reflection auto-wiring.** If a dependency cannot be traced through imports and constructor parameters, it is banned.
- **Boring names.** Names describe structural intent, not vibes. Use `ClockPort`, `UuidPort`, `UserRepositoryPort`, `PostgresUserRepositoryAdapter`.
- **One exported domain concept per file.** Private helpers may live beside the concept they serve. Split when helpers gain independent meaning.

> **Sensei's Wisdom™**  
> If an agent must open six files to understand one behavior, the architecture is generating fog.

---

## Rule 2: Deterministic Architecture

The domain core must be isolated from side effects, ambient state, and host environments.

### Non-negotiables

- **Hexagonal architecture is mandatory.** Core logic owns ports. Infrastructure owns adapters.
- **The core does not know the filesystem, network, database, process environment, browser APIs, system clock, UUID generator, or random source.**
- **Time, randomness, and UUIDs are injected.** Tests must be able to replay behavior with fixed clocks and seeded randoms.
- **The core must be portable.** It should be able to run in Node, Deno, Bun, or a browser sandbox without architectural surgery.

```ts
export interface ClockPort {
  now(): Instant;
}

export interface UuidPort {
  next(): Uuid;
}
```

> **Sensei's Wisdom™**  
> Time is global mutable state wearing a watch. Inject it.

---

## Rule 3: The Data Model Is the Domain Model

We reject shape-soup: `interface` + factory + erased invariants + TODO comments pretending to be constraints.

### Non-negotiables

- **Domain concepts with invariants are classes.** They validate themselves at construction.
- **Domain values are immutable by construction.** Use `readonly` for compile-time protection and freezing or defensive copying where runtime mutation would violate an invariant.
- **Nested mutable inputs must be copied, frozen, or rejected.** `Object.freeze()` is shallow. Do not pretend otherwise.
- **Behavior-rich concepts own their behavior.** Prefer methods on domain values over external switch jungles.
- **Serialization is an adapter concern.** Domain models do not know how to JSON-stringify, CBOR-encode, persist, or hydrate themselves from framework payloads.

### Allowed TypeScript shapes

Interfaces and type aliases are allowed for:

- ports;
- adapter DTOs;
- config shapes;
- closed protocol variants;
- test fixtures;
- serialization payloads.

Discriminated unions are allowed for closed variant data, provided every branch is exhaustively checked and raw external tags are validated before entering the core.

> **Sensei's Wisdom™**  
> Classes are not “enterprise.” Bad classes are enterprise. Good classes are runtime law.

---

## Rule 4: Tests Use Deterministic Worlds

The test suite must prove behavior, not choreography.

### Non-negotiables

- **RED:** create the smallest deterministic regression test.
- **GREEN:** implement the smallest architecture-preserving fix.
- **VERIFY:** rerun the regression and the relevant test group.
- **PROVENANCE:** commit one focused, atomic change.

### Test double policy

- **Mocks of domain internals are banned.**
- **Use in-memory adapter fakes behind ports.**
- **Spies and stubs are permitted only at process boundaries where no deterministic fake is practical.**
- **Tests assert observable behavior, not private implementation text.**

> **Sensei's Wisdom™**  
> A fake is a small deterministic world. A mock is gossip with syntax.

---

## Rule 5: Provenance-Native Execution

We do not normalize sludge, and we do not hide risk behind green CI reruns.

A pass after an unexplained failure is evidence of nondeterminism. Investigate it. Do not shrug and ship.

### Commit policy

Commits must tell a deterministic history of the system.

- One behavior change per commit.
- No “misc fixes.”
- No structural migrations squashed into features.
- No drive-by refactors.
- No unexplained test flakes.
- Commit messages must name the observable system change.

Recommended format:

```text
fix(clock): inject fixed clock into token expiry test
```

### Exception format

Every rule exception must include:

1. the rule being violated;
2. why the rule cannot apply;
3. why the alternative is safe;
4. where runtime validation occurs;
5. who approved it;
6. when it expires or will be revisited.

---

## Rule 6: The Agent Context Mandate — Graft

No automated agent, coding assistant, or LLM-driven process may perform raw, unfiltered filesystem reads against this repository.

Agents are bounded observers. They are not entitled to the entire monolithic state of the universe. They are entitled to the smallest structurally correct view required to complete the task.

### Non-negotiables

- **No raw reads by agents.** Tools that dump entire files are banned for agent use.
- **No unbounded search by agents.** Brute-force global grep and unrestricted history scanning are banned.
- **Mandatory structural projections.** Agents must use `safe_read`.
- **Large files require outline-first reading.** If a file exceeds 150 lines or 12 KB, the agent must accept the AST-derived outline first, then range-read specific bodies.
- **Precision symbol lookup.** Agents use `code_show` for targeted domain/history lookup.
- **Receipt auditing.** Every agent-authored commit carries a Graft receipt.

### Receipt minimum schema

```json
{
  "schema": "graft.receipt.v1",
  "sessionId": "2026-06-17T12-45-00Z-agent-abc123",
  "agent": "codex-or-other-agent-name",
  "task": "Fix token expiry determinism",
  "bytesConsumed": 18422,
  "filesRead": ["src/core/token/TokenPolicy.ts"],
  "filesModified": ["src/core/token/TokenPolicy.ts", "src/core/token/TokenPolicy.test.ts"],
  "tripwires": [],
  "commit": "filled-after-commit"
}
```

> **Sensei's Wisdom™**  
> Agent context is a budget, not a buffet.

---

## Rule 7: Code Dojo™ Enforcement

The repository enforces this doctrine through TypeScript, ESLint, hooks, and CI.

Local hooks are there to stop mistakes early. CI is there to stop intentional bypasses.

Required checks:

- `tsc --noEmit`
- type-aware ESLint
- deterministic test run
- core purity scan
- file/context threshold scan
- mock-ban scan
- commit-message policy
- optional Graft receipt validation

> **Sensei's Wisdom™**  
> `--no-verify` is a confession, not a strategy.

---

## Required TypeScript Posture

The repository must enable strict type checking and the extra runtime-footgun guards:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "noImplicitReturns": true,
  "noPropertyAccessFromIndexSignature": true,
  "useUnknownInCatchVariables": true
}
```

## Required ESLint Posture

The repository must run type-aware linting with strict TypeScript rules and explicit bans on unsafe values, unsafe returns, unsafe calls, unsafe member access, unsafe arguments, unsafe narrowing assertions, floating promises, and non-exhaustive switches.

## Final Law

The system should be boring enough that a tired human can review it and constrained enough that an LLM agent cannot improvise architecture.

Cleverness is allowed only when it makes runtime truth more explicit.

Everything else gets the bamboo stick.
