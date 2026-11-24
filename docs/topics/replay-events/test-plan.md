# Test plan: replay event outbox

This ledger lists each requirement of the [replay event outbox](./README.md),
the test that holds it, and its status. The oracle for each case is the
assertion in the named test. Core tests are in
`packages/bijou/src/core/replay/`; file tests are in `packages/bijou-node/src/`.
The golden bytes in `packages/bijou-node/src/replay-outbox.golden.jsonl` were
written by hand, and the golden frame hash was computed with `shasum`, not by
the implementation.

## Golden and modes: `replay-file-outbox.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| RPO-01 | A fixed event list serializes to the golden JSONL in memory. | `writes the golden JSONL bytes from memory` | Implemented |
| RPO-02 | The file outbox writes byte-identical golden bytes. | `writes the same golden bytes to a file` | Implemented |
| RPO-03 | UTF-8, no byte-order mark, every line ends with `\n`. | `frames every line as UTF-8 JSON ending in a newline, with no byte-order mark` | Implemented |
| RPO-04 | Every written line validates against the published JSON Schema. | `validates every written line against the published JSON Schema` | Implemented |
| RPO-05 | The schema rejects lines that break the envelope. | `has a schema that rejects lines breaking the DL-033 envelope` | Implemented |
| RPO-06 | Read back, the JSONL equals `events()` and re-serializes to the same bytes. | `round-trips: parsed lines equal events() and re-serialize to the same bytes` | Implemented |
| RPO-07 | An empty session (`session`, `end`) is valid and equal in both modes. | `records an empty session (session and end) identically in both modes` | Implemented |
| RPO-08 | `surfaceFrameHash()` matches `node:crypto` and the golden hash. | `hashes the canonical frame content, matching node:crypto and the golden` | Implemented |
| RPO-09 | The README example shows real output. | `shows the bytes the appending example really writes` | Implemented |

## Canonical JSON: `canonical-json.test.ts`, `canonical-json.property.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| RPO-10 | Keys sorted, no whitespace. | `sorts object keys by code point and writes no whitespace` | Implemented |
| RPO-11 | Key order is by code point, not UTF-16 code unit. | `orders a BMP key above the surrogate range before an astral key` | Implemented |
| RPO-12 | `-0` is `0`; strings escape as `JSON.stringify` does. | `writes -0 as 0 and escapes strings as JSON.stringify does` | Implemented |
| RPO-13 | Null-prototype objects and shared acyclic values are accepted. | `accepts a null-prototype object and a value shared without a cycle` | Implemented |
| RPO-14 | Each DL-033 non-plain value is rejected with its path. | `rejects %s with its path` | Implemented |
| RPO-15 | Cycles, symbol keys, accessors and hidden properties are rejected. | `rejects cycles, symbol keys, accessors and non-enumerable properties` | Implemented |
| RPO-16 | Error messages never quote the rejected value. | `names a path in the message without quoting the rejected value` | Implemented |
| RPO-17 | Seeded: canonical output is a fixed point of a JSON round trip. | `is a fixed point after a JSON round trip` | Implemented |
| RPO-18 | Seeded: output does not depend on key insertion order. | `does not depend on key insertion order` | Implemented |
| RPO-19 | Seeded: key order equals a code-point sort. | `orders keys as a code-point sort of the strings does` | Implemented |
| RPO-20 | Seeded: `compareCodePoints()` agrees with code points from `Array.from`. | `matches code-point order from Array.from on every string pair` | Implemented |

## Append rules: `replay-outbox.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| RPO-21 | `seq` starts at 0 in append order; `schema` is added. | `assigns seq from 0 in append order and adds the schema` | Implemented |
| RPO-22 | 5,000 rapid appends stay in order with no gaps. | `keeps every event in order under rapid appends` | Implemented |
| RPO-23 | A callback in a payload is rejected and leaves no `seq` gap. | `rejects a callback in a payload and leaves no seq gap` | Implemented |
| RPO-24 | A payload changed after append does not change the recording. | `snapshots payloads at append time` | Implemented |
| RPO-25 | Malformed envelopes are `invalid-envelope` and use no `seq`. | `rejects %s as an invalid envelope` | Implemented |
| RPO-26 | The outbox adds no kind ordering rule. | `enforces no kind order: ordering belongs to the emitter (DL-033)` | Implemented |
| RPO-27 | Append after close is `closed`; lines stay readable. | `refuses appends after close and keeps the recorded lines` | Implemented |
| RPO-28 | A sink write failure is `sink-failed` with its cause, then sticky `failed`. | `reports sink-failed with the cause, then stays failed` | Implemented |
| RPO-29 | A failing sink close is `sink-failed`. | `reports a failing close as sink-failed` | Implemented |

## File lifecycle and errors: `replay-file-outbox-errors.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| RPO-30 | Reopening a recorded path is `open-failed` (`EEXIST`); bytes are intact. | `refuses to reopen a recorded path and leaves its bytes intact` | Implemented |
| RPO-31 | `overwrite` replaces the file and restarts at `seq` 0. | `replaces the file when reopened with overwrite, restarting seq at 0` | Implemented |
| RPO-32 | Append after close is `closed` and writes nothing. | `throws closed for an append after close and writes nothing more` | Implemented |
| RPO-33 | A path in a missing directory is `open-failed` (`ENOENT`). | `throws open-failed for a path in a missing directory and creates nothing` | Implemented |
| RPO-34 | A directory path is `open-failed`. | `throws open-failed when the path is a directory` | Implemented |
| RPO-35 | A rejected payload writes nothing to the file. | `writes nothing for a rejected payload and keeps seq contiguous` | Implemented |
| RPO-36 | A full disk is `sink-failed` (`ENOSPC`), then `failed`. Runs where `/dev/full` exists (Linux, including the sealed runner). | `reports a full disk as sink-failed, then stays failed` | Implemented |

## Seeded random sequences: `replay-file-outbox.property.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| RPO-37 | Memory and file bytes are identical, in `seq` order, canonical. | `writes byte-identical JSONL in memory and on disk, in seq order, canonically` | Implemented |
| RPO-38 | The same sequence gives the same bytes on every run. | `gives the same bytes for the same sequence on every run` | Implemented |
