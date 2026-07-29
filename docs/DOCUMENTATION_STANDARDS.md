# Documentation Standards

**Status:** Current project policy for new and substantially changed
documentation.

**Applies to:** User, DOGFOOD, component, CLI, MCP, runtime, IR, release,
workflow, and contributor documentation in Bijou.

**Normative terms:** **MUST**, **SHOULD**, and **MAY** indicate requirement
strength.

This standard adapts reader-task documentation discipline to Bijou's existing
contract, Method, and DOGFOOD practices. It does not require a mass rewrite of
existing pages. Apply it when creating documentation, changing behavior, or
touching a page enough that leaving it below this bar would create new debt.

## 1. Purpose

Documentation is part of the product contract. A Bijou page should help a
specific reader do one of these jobs:

- learn the product through a guided first success;
- complete a real task in their own environment;
- look up exact facts while working;
- understand a concept, invariant, boundary, or design choice;
- troubleshoot an observable failure;
- change the implementation safely and verify the result;
- inspect a release, cycle, or architecture decision and its evidence.

A page MUST have one primary job. Do not force a README, design document, topic
page, or release packet to behave as a tutorial, reference manual, roadmap, and
architecture guide at the same time.

## 2. Corpus Map

Bijou keeps durable truth in a small set of known places.

| Location                                                                 | Primary job                                                                                                               |
| :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `README.md`                                                              | Public front door: what Bijou is, package roles, quick start, current release posture, and links to deeper documentation. |
| `GUIDE.md`                                                               | Repository and package orientation for readers moving beyond the quick start.                                             |
| `docs/README.md`                                                         | Documentation spine and intent-based routing index. New durable pages MUST be linked here.                                |
| `docs/DOGFOOD.md`                                                        | Contract for the canonical human-facing documentation application and proving surface.                                    |
| `docs/guides/`                                                           | Tutorials and how-to guides for supported user and contributor workflows.                                                 |
| `docs/design-system/`                                                    | Living design-system reference: foundations, tokens, components, families, and patterns.                                  |
| `docs/invariants/`                                                       | Short, living explanations of architectural laws that current implementation and tests uphold.                            |
| `docs/CLI.md`                                                            | Exact command and operator-script reference.                                                                              |
| `docs/MCP.md`                                                            | Exact MCP server and tool reference.                                                                                      |
| `docs/ARCHITECTURE.md`                                                   | Current structural explanation for packages, ports, adapters, and major runtime relationships.                            |
| `docs/design/`                                                           | Cycle design records. Active records define proposed contracts; landed records preserve why a change was made.            |
| `tests/cycles/`                                                          | Executable cycle evidence. Tests are the specification when prose and executable behavior disagree.                       |
| `docs/METHOD.md`                                                         | Living repository work doctrine.                                                                                          |
| `docs/WORKFLOW.md`                                                       | Concise operator workflow and recurring safety practices.                                                                 |
| `docs/method/releases/`                                                  | Release packets, goalposts, and release evidence.                                                                         |
| `docs/ROADMAP.md`                                                        | Human-readable release horizon derived from live GitHub tracker state.                                                    |
| `docs/BEARING.md`                                                        | Current direction, immediate target, and active tensions.                                                                 |
| `docs/CHANGELOG.md`                                                      | Release-visible historical ledger.                                                                                        |
| `docs/archive/`, `docs/audit/`, `docs/audits/`, and `docs/method/retro/` | Historical snapshots. They explain prior state and MUST NOT pose as current truth.                                        |

GitHub Issues, milestones, pull requests, and labels own live work state.
Repository documentation explains contracts, decisions, evidence, and how live
tracker items compose. When tracker state and planning prose disagree, GitHub
wins and the documentation requires upkeep.

Do not create empty placeholder directories. Add a page when it has a real
reader job.

## 3. Page Types

### 3.1 Tutorial

A tutorial is a guided learning path. Use one when a newcomer needs a
controlled first success, such as rendering a first component or building a
small framed application.

A tutorial MUST:

- state prerequisites and starting state;
- use a known-good supported path;
- provide actions in tested order;
- show expected intermediate and final results;
- explain how to verify success;
- end with what the reader learned and where to go next.

### 3.2 How-To Guide

A how-to guide helps a competent reader complete a real task, such as adding a
component to DOGFOOD, recording a fixture, or running a release gate.

A how-to guide MUST:

- be titled as a goal, preferably starting with a verb;
- state the expected result;
- identify blocking prerequisites;
- give the shortest safe route to the result;
- include exact commands, settings, controls, or API calls;
- explain how to verify success;
- link to reference or explanation instead of reproducing it.

### 3.3 Reference

Reference pages support exact lookup. Public reference includes:

- package exports and component options;
- CLI commands, arguments, exit behavior, and output;
- MCP tools, inputs, results, and errors;
- IR, artifact, source-map, receipt, and validation contracts;
- theme tokens, component families, and lower-mode behavior;
- configuration, environment variables, and repository scripts.

Reference MUST state exact names, syntax, fields, defaults, constraints,
compatibility behavior, output, errors, and examples. When the underlying
surface is machine-readable, reference SHOULD be generated or coverage checked.

Reference describes behavior that exists. Proposed behavior belongs in a design
record, issue, or roadmap.

### 3.4 Explanation And Invariant

Explanation develops a mental model: why Bijou separates Components from
Blocks, why layout owns interaction geometry, or why graceful lowering
preserves meaning.

Explanation SHOULD describe mechanisms, relationships, tradeoffs,
alternatives, and limits. It MUST NOT become an unstructured source-file tour.

An invariant page states one durable law. It MUST name:

- the law;
- the boundary it protects;
- observable consequences;
- executable evidence or the current evidence gap.

### 3.5 Design Record

A design record shapes one bounded change. It MUST identify:

- the decision summary and hill;
- current truth;
- scope and non-goals;
- public, runtime, artifact, or workflow contract;
- tests to write first;
- acceptance criteria;
- playback questions;
- tracker ownership.

Proposed work is not evidence. After implementation, the record SHOULD include
the measured result or link to its witness.

### 3.6 Test Plan And Executable Evidence

A test plan is the contract ledger for behavior. It MUST identify:

- stable requirement or cycle identities where the repository uses them;
- planned or implemented cases;
- the exact behavior or invariant under test;
- the oracle;
- the evidence type;
- the status;
- the concrete test, fixture, script, or witness when implemented.

A gap MUST be marked as a gap. Planned work MUST NOT be described as passing
evidence.

### 3.7 Troubleshooting

Troubleshooting starts with a symptom a user or operator can observe, such as:

- terminal output is missing color;
- input reaches the wrong layer;
- DOGFOOD does not render;
- an artifact fails validation;
- a release or Code Dojo gate fails.

A troubleshooting page MUST list discriminating checks first, map signals to
likely causes, give concrete recovery actions, and show how to verify the fix.

### 3.8 Workflow Reference

A workflow reference describes a recurring contributor or maintainer
operation, such as preparing a release, processing review feedback, or updating
a ratchet.

A workflow reference MUST:

- describe only the current operational contract;
- identify authoritative scripts and runbooks;
- link to workflow verification or witness evidence;
- place warnings before destructive, privileged, or externally visible steps;
- avoid duplicating product reference, release notes, or roadmap promises.

### 3.9 Release And Historical Record

A release packet records a bounded release decision, its scope, gates, and
publication evidence. A changelog records notable user- or operator-visible
change.

Historical records MUST remain clearly historical. Do not silently rewrite a
past audit, retro, or shipped release record to match current implementation.
Add a current reference or a dated correction instead.

## 4. Documentation Upkeep Loop

For a meaningful behavior, contract, or workflow change:

1. Update design or rationale when the change needs design discussion.
2. Update the relevant test plan or cycle contract before implementation.
3. Add the smallest deterministic executable evidence that fails for the
   missing behavior.
4. Implement the behavior.
5. Update living reference after the behavior exists.
6. Mark planned cases implemented and record the actual evidence.
7. Update `README.md`, `docs/README.md`, `docs/CHANGELOG.md`,
   `docs/ROADMAP.md`, and `docs/BEARING.md` when public surface,
   documentation routing, release status, or project posture changes.
8. Run documentation upkeep before final self-review and before requesting
   final pull-request review.

Small fixes may scale this down. They still need an honest claim, executable
evidence when behavior changes, and living documentation that does not
contradict the result.

## 5. Examples And Executable Truth

Examples are part of the contract.

User-facing examples MUST:

- be syntactically valid;
- use supported behavior;
- include enough context to run or interpret them;
- use least-privileged and safe defaults;
- identify destructive or privileged actions before they appear;
- show an observable result when one exists.

Examples SHOULD be extracted from tested files or executed in CI when
practical.

### 5.1 Runnable, Illustrative, And Abridged Examples

A runnable example uses supported behavior and includes required context. Test
or execute it automatically when practical.

An illustrative example may omit setup or nonessential detail, but it MUST be
labeled illustrative and MUST NOT be presented as directly runnable.

An abridged example may shorten large input or output, but it MUST identify the
omitted material and preserve the behavior relevant to the explanation.

### 5.2 Code Blocks And Terminal Examples

Every fenced block SHOULD declare its language or content type:

- `bash` or `sh` for copyable shell commands;
- `typescript`, `json`, `yaml`, or the relevant language for structured input;
- `text` for expected output;
- `console` only for a deliberate transcript containing prompts and output.

Do not include `$` or `>` prompts in a block intended for copy and paste.
Present commands and output separately.

Run:

```bash
npm run code-dojo:debt
```

Expected output shape:

```text
Code Dojo debt: N violations
```

When output is nondeterministic, say which parts vary. Label output as exact,
representative, or abridged when the distinction matters. Never fabricate
output to make an example appear complete.

### 5.3 Placeholders

Use clearly fictional and context-safe values.

| Context                | Preferred placeholder                                 |
| :--------------------- | :---------------------------------------------------- |
| Copyable shell command | `sample.ts`, `example-target`, or `$BIJOU_EXAMPLE`    |
| Configuration value    | `"sample"` or `"example-theme"`                       |
| Hostname               | `example.com`                                         |
| Formal syntax notation | `<artifact>`                                          |
| Secret or credential   | an explicitly fake value such as `test_token_example` |

Do not use `<your-file>` inside a copyable shell command because angle brackets
have shell meaning.

### 5.4 Dangerous Commands

For destructive, privileged, costly, irreversible, or externally visible
actions:

1. Place the warning before the command.
2. State the exact consequence and scope.
3. Provide a dry run or safer alternative when available.
4. State required permissions.
5. Include backup or rollback guidance when applicable.
6. Explain how to verify the result.

## 6. Visuals And Accessibility

Visual products should be shown visually when the visual answers a reader
question. Bijou documentation MAY use terminal captures, DOGFOOD fixtures,
screenshots, annotated examples, or short recordings.

Every nontrivial visual MUST:

- answer a stated or obvious reader question;
- have meaningful labels or adjacent explanation;
- include alt text or a concise textual equivalent;
- distinguish conceptual simplification from exact implementation when needed;
- omit secrets, personal data, production identifiers, and sensitive details.

Informative images MUST have alt text or a textual equivalent. Decorative
images SHOULD have empty alt text where the publishing surface supports it.
Complex diagrams SHOULD have adjacent explanatory prose instead of relying on
a long alt attribute.

Visuals MUST NOT rely on color, position, animation, or shape alone to
communicate essential meaning. Screenshots and recordings MUST NOT be the only
place where essential instructions, code, or errors appear.

Terminal examples MUST preserve accessible and pipe-mode meaning when the
document claims those modes are supported.

## 7. Writing, Style, And Terminology

Write like a competent teammate: direct, precise, and approachable.

- Use `you` for actions the reader performs.
- Use `Bijou`, the package name, command, script, or component name for actions
  the system performs.
- Use imperative verbs for procedures.
- Prefer active voice when it clarifies responsibility.
- Use present tense for current behavior.
- Avoid hype, vague reassurance, unnecessary apology, and excessive
  exclamation.
- Avoid `we` unless referring to an explicit project decision or policy.

Put the result, decision, warning, or essential condition first. Give each
sentence one main job. Use numbered lists for ordered procedures and bullets
for parallel options, requirements, or checks.

### 7.1 Markdown And Typography

Use formatting to communicate type, not to manufacture emphasis.

- Use bold for exact visible labels and genuine warnings.
- Use inline code for commands, options, filenames, paths, configuration keys,
  fields, literal values, error identities, and code symbols.
- Use exact casing for products, packages, commands, fields, and errors.
- Use `<kbd>` for keyboard keys where the publishing surface renders it
  accessibly; otherwise use inline code.
- Use descriptive link text that states what the destination provides.
- Do not use `here`, `this link`, or a bare filename as the entire link label.
- Declare a language or content type on fenced blocks.

Use tables only for genuinely two-dimensional lookup, comparison, or
structured facts. Do not use them for long narrative passages or procedures.

### 7.2 Canonical Terminology

Use one canonical term for each concept. Define unfamiliar terms at first use.
Mention an alias once only when it materially improves search or recognition.

Use exact Bijou distinctions:

- A **Component** is leaf rendering vocabulary.
- A **Block** owns product semantics, data contracts, and lowering facts.
- A **Surface** is structured terminal-cell output.
- `ui-scene-ir/1`, `bijou-block/1`, and other versioned artifacts are explicit
  contracts.
- Interactive, static, pipe, and accessible are output modes with distinct
  claims.
- A command requests change; an effect interacts with the outside world.

### 7.3 Inclusive And Accessible Language

Use literal, neutral language that describes the technical condition directly.

- Use gender-neutral language when gender is irrelevant.
- Avoid identity-based or stigmatizing metaphors.
- Prefer unavailable, hidden, degraded, unresponsive, excluded, or blocked
  when those are the actual conditions.
- Avoid culturally specific idioms when they make instructions harder to
  understand or translate.

### 7.4 Notes, Cautions, And Warnings

Use callouts consistently:

- **Note** — useful context that does not affect safety or correctness.
- **Important** — information required to complete the task correctly.
- **Caution** — an action may cause an undesirable or costly result.
- **Warning** — an action may cause data loss, a security problem, or an
  irreversible change.

Do not use a warning merely to make ordinary text look important.

## 8. Checks And Enforcement

Documentation quality requires deterministic checks and human judgment.

Run the current repository documentation gates for documentation changes:

```bash
npm run docs:inventory
git diff --check
```

When design-system documentation changes, also run:

```bash
npm run docs:design-system:preflight
```

When workflow files change, run an available pinned workflow validator. If the
repository does not provide one, record that absence rather than claiming the
workflow was validated.

The repository contains `.markdownlint.json`, but no pinned Markdown-lint
runner or internal-link checker is currently part of `package.json`. Until
those tools land, Markdown style and internal links remain required review
checks rather than falsely reported automated gates.

CI SHOULD block on facts it can determine reliably:

- malformed Markdown when a pinned checker exists;
- broken internal paths and explicit anchors when an offline checker exists;
- references to repository files that do not exist;
- failed examples or tutorials declared executable;
- undocumented public commands, options, settings, fields, statuses, or errors
  when coverage is required;
- informative images without alt text or a textual equivalent;
- changed contract behavior without updated evidence or a documented
  no-documentation-impact decision;
- destructive examples without a preceding warning;
- examples containing real credentials or forbidden production identifiers.

The following SHOULD normally remain advisory:

- page, sentence, or paragraph length;
- passive voice and jargon density;
- number of bullets;
- suspected missing diagrams;
- tone and template-like phrasing;
- table complexity;
- external-link health;
- screenshot age;
- pull-request size.

These signals help editors. They are poor universal merge gates.

## 9. Review Checklist

Before calling a documentation change complete, check:

- The page has one primary reader job.
- Living references describe the behavior proposed for the merge target.
- Planned work lives in a design record, test plan, roadmap, issue, or PR.
- Examples use supported behavior and show observable results when practical.
- Public commands, options, settings, fields, statuses, and errors have or link
  to reference coverage.
- User-facing terminal behavior has a capture, fixture, or textual equivalent
  when a visual materially helps.
- New durable pages are linked from `docs/README.md`.
- Release-visible changes update `docs/CHANGELOG.md`.
- Direction or release-order changes update `docs/ROADMAP.md` and
  `docs/BEARING.md`.
- `npm run docs:inventory` and `git diff --check` pass.

The objective is not a perfectly uniform library. The objective is a
documentation corpus where readers, reviewers, tests, and agents can find the
right authoritative page at the moment they need it.
