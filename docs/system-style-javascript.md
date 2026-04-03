# System-Style JavaScript

_How to write JavaScript infrastructure that lasts._

This is a repo-wide engineering doctrine for Bijou and other
`flyingrobots` codebases. It is not a formatting style guide. It is a
doctrine for writing infrastructure that remains honest under execution,
replay, migration, debugging, replication, failure, and time.

## Bijou Adaptation

Bijou is currently implemented largely in TypeScript. That does not
weaken this doctrine. It sharpens how TypeScript should be used here.

In this repo:

- TypeScript is a useful dialect, not the final authority
- runtime-backed modeling outranks type-only confidence
- boundary parsing, explicit adapters, and tests outrank editor comfort
- strong claims about architecture should be anchored in runtime code,
  invariants, and executable proof

This doctrine therefore does **not** mean "rewrite Bijou into plain
`.js` tomorrow." It means Bijou should treat runtime truth as
architectural authority even when the implementation language is
TypeScript.

## Rule 0: Runtime Truth Wins

When the program is running, one question matters above all others:

**What is actually true right now, in memory, under execution?**

If the answer depends on comments, conventions, vanished types, wishful
thinking, or editor vibes, the code is lying.

Trusted domain values must be created through runtime construction,
parsing, or validation that establishes their invariants. Once
established, those invariants must be preserved for as long as the value
remains trusted.

This rule outranks documentation, build steps, editor hints, static
overlays, compile-time tooling, team folklore, and "but the linter said
it was fine."

## What This Means In Practice

Infrastructure cannot afford fake contracts:

- a type that vanishes at runtime is not an authoritative contract
- a comment describing a shape is not an authoritative contract
- a plain object that "should" have valid fields is not an authoritative
  contract
- an IDE tooltip is not an authoritative contract
- a compile step is not an authoritative contract

These tools can be useful. None of them outrank the runtime.

## Why It Matters Here

Bijou is not just view glue. The repo touches:

- runtime state and event flow
- host boundaries and adapters
- deterministic tests and replayability
- localization catalogs and exchange formats
- long-lived public APIs
- shell behavior that needs to stay explainable to both humans and
  agents

Mushy assumptions here turn into bugs with long half-lives.

## The Hierarchy Of Truth

When layers disagree, authority flows in this order:

1. **Runtime domain model**: constructors, invariants, methods, error
   types
2. **Boundary schemas and parsers**: Zod, decoders, protocol validators
3. **Tests**: the executable specification
4. **JSDoc and design docs**: human-facing explanations of the runtime
   model
5. **IDE and static tooling**: navigation, refactoring support
6. **TypeScript**: useful dialect, not final authority

## Scope

This standard is optimized for:

- infrastructure code with strong invariants
- long-lived systems with explicit boundaries
- direct execution workflows portable across hosts
- browser-capable cores
- JavaScript-first or TypeScript-as-dialect repositories
- code that must be teachable, legible, and publishable

It is not a claim that every JavaScript project should look like this.
It **is** a claim that, for this family of repositories, runtime-backed
domain modeling beats soft shape trust.

## Language Policy

### JavaScript First, TypeScript Subordinate

JavaScript remains the conceptual base language for this doctrine:

- fast to write and change
- direct to execute
- portable
- expressive enough for serious infrastructure
- readable enough to teach from

Bijou currently uses TypeScript heavily, but the rule is the same:
TypeScript may improve refactoring, editor support, and consumer
ergonomics. It does **not** replace runtime validation, preserve
invariants by itself, or excuse weak modeling.

Use TypeScript where it helps. Never confuse it with the source of
truth.

### Escape Hatch: Rust Via WebAssembly

When JavaScript is insufficient for tight CPU work, hostile binary
parsing, cryptographic kernels, or memory-sensitive hot loops, use Rust.

Preferred split:

| Layer | Language | Role |
|------|------|------|
| Core domain logic | JavaScript / TypeScript with runtime-backed modeling | Default, portable, browser-capable |
| Performance-critical kernels | Rust -> Wasm | Safety and speed where justified |
| Host adapters | JavaScript / TypeScript | Node, browser, worker boundaries |
| Orchestration | JavaScript / TypeScript | Glue between cores and hosts |

## Architecture

### Browser-First Portability

The browser is the most universal deployment platform and the ultimate
portability test. Core logic should prefer web-platform-friendly
primitives.

```javascript
// Portable
const bytes = new TextEncoder().encode(text);
const arr = new Uint8Array(buffer);
const url = new URL(path, base);

// Node-only; belongs in adapters
const buf = Buffer.from(text, 'utf8');
const resolved = require('path').resolve(p);
```

### Hexagonal Architecture Is Mandatory

Core domain logic must not depend directly on Node globals, filesystem
APIs, `process`, `Buffer`, or host-specific calls. Those belong behind
adapter ports.

**Core rule:** core logic should not know that Node exists.

In Bijou terms:

- `@flyingrobots/bijou` defines ports and pure helpers
- `@flyingrobots/bijou-node` owns Node integration
- runtime, i18n, and tooling seams should stay explicit rather than
  leaking host assumptions inward

## Object Model

System-style JavaScript organizes code around runtime-backed objects:

- **Value objects** for meaningful values with invariants
- **Entities** for identity and lifecycle
- **Results / outcomes** as runtime-dispatchable objects, not soft tagged
  bags
- **Errors** as first-class domain failures, not stringly typed message
  parsing

Classes are often a good tool here, but the actual rule is stronger than
"use classes": important concepts need runtime-backed forms with
preserved invariants.

## Principles

### P1: Domain Concepts Require Runtime-Backed Forms

If a concept has invariants, identity, or behavior, it needs a
runtime-backed representation. A typedef or plain object is not enough.

### P2: Validation Happens At Boundaries And Construction Points

Untrusted input becomes trusted data only through constructors or
dedicated parse methods. Constructors establish invariants and do not
perform I/O.

### P3: Behavior Belongs On The Type That Owns It

Avoid switching on `kind` or `type` tags when runtime dispatch will do.
Put behavior on the owning type.

### P4: Schemas Belong At Boundaries, Not In The Core

Use schemas to reject malformed input at the edge. Domain types own
behavior and invariants inside the boundary.

### P5: Serialization Is The Codec's Problem

The byte layer stays separate from the meaning layer. Domain types do
not need to know how they are encoded.

### P6: Single Source Of Truth

Do not duplicate the same contract across JSDoc, TypeScript, and
validators. Define the runtime model first. Everything else derives from
or documents it.

### P7: Runtime Dispatch Over Tag Switching

Inside a coherent runtime, `instanceof` is often correct. When values
cross realms or duplicate module boundaries, use branding instead of
pretending nominal identity still holds.

## Practices

- **`any` is banished; `unknown` is quarantined**: `unknown` is allowed
  only at raw edges and should be eliminated immediately through parsing
- **trusted values must preserve integrity**: use `Object.freeze()`,
  private state, or defensive copying where needed
- **error type is primary; codes are optional metadata**: never branch
  on `err.message`
- **parameter objects must add semantic value**: do not normalize option
  sludge into public API design
- **raw objects may carry bytes, not meaning**: plain objects are for
  decoded payloads or logging, not trusted domain semantics
- **magic numbers and strings are banished**: give semantic constants
  real names
- **boolean trap parameters are banished**: prefer named policies or
  separate methods
- **structured data stays structured**: do not make machines parse prose
  to recover data
- **module scope is the first privacy boundary**: if it is not exported,
  it is private
- **JSDoc documents the runtime model; it does not replace it**

## Tooling Discipline

**Lint is law.**

- lint errors fail CI
- suppressions require a documented reason
- the hardest enforcement should land on unsafe coercion, floating
  promises, raw `Error` use, and host-specific leakage into core code

When TypeScript is used:

- it remains subordinate to runtime validation
- it must not substitute for domain modeling
- `any` is banned
- `unknown` belongs only at raw edges and should disappear quickly

## The Anti-Shape-Soup Doctrine

Most bad infrastructure comes from weak modeling. The discipline is:

1. name the concept
2. construct the concept with validated invariants
3. protect the invariant
4. attach the behavior to the owning type
5. guard the boundary with schemas and parsers
6. separate the codec from the domain
7. isolate the host behind adapters
8. document the runtime that actually exists
9. test the truth

## Review Checklist

Before merging, ask:

- is this a real domain concept, and where is its runtime-backed form?
- where is `unknown` eliminated?
- does construction establish trust?
- does behavior live on the type that owns it?
- is anyone parsing `err.message` like a raccoon in a dumpster?
- are there magic numbers or strings?
- could this logic run in a browser-capable core?
- is tooling fiction being mistaken for architecture?

## Derived Invariants

This doctrine is reflected in these repo invariants:

- [Runtime Truth Wins](./invariants/runtime-truth-wins.md)
- [Schemas Live at Boundaries](./invariants/schemas-live-at-boundaries.md)
- [Host APIs Stay Behind Adapters](./invariants/host-apis-stay-behind-adapters.md)
- [Codecs Are Not Domain Models](./invariants/codecs-are-not-domain-models.md)
- [Tests Are the Spec](./invariants/tests-are-the-spec.md)

This is infrastructure. Code cannot rely on costumes or pretend that
comments are contracts. Runtime truth beats phantom certainty every
time.

