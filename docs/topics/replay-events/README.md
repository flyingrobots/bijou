# Replay event outbox

The replay outbox records a replay stream: ordered `bijou-replay-event/1`
events written as JSONL. [DL-033](../design/DL-033-replay-event-envelope.md)
decides the envelope, kinds, ordering and hash rules. This page describes the
outbox that exists. No host path emits to it yet: `runScript()` emission is
flyingrobots/bijou#602.

The JSON Schema for one line is
[`schemas/bijou-replay-event.v1.schema.json`](../../schemas/bijou-replay-event.v1.schema.json).
The [test plan](./test-plan.md) lists each requirement and its test.

## Where it lives

| Export | Package | Runs in |
| --- | --- | --- |
| `createMemoryReplayOutbox()` | `@flyingrobots/bijou` and `@flyingrobots/bijou-node` | Node and browsers |
| `createReplayOutbox(sink)` | `@flyingrobots/bijou` and `@flyingrobots/bijou-node` | Node and browsers |
| `canonicalJson(value)`, `surfaceFrameHash(frame)` | `@flyingrobots/bijou` and `@flyingrobots/bijou-node` | Node and browsers |
| `createReplayFileOutbox(path, options?)` | `@flyingrobots/bijou-node` | Node |

The pure part is in `packages/bijou/src/core/replay/`. It reads no clock,
randomness, filesystem or environment, so the in-memory outbox runs in a
browser and `bijou-tui` can import the serializer and hash without depending
on `bijou-node`. `bijou-node` re-exports it, so the API DL-033 places in
`bijou-node` is available there. Only the file adapter uses `node:fs`.

## Appending

```ts
import { createMemoryReplayOutbox } from '@flyingrobots/bijou';

const outbox = createMemoryReplayOutbox();
outbox.append({
  tick: 0,
  atMs: 0,
  kind: 'debug-fact',
  payload: { name: 'focus.target', value: 'search' },
});
outbox.close();
outbox.toJSONL();
// '{"atMs":0,"kind":"debug-fact","payload":{"name":"focus.target","value":"search"},"schema":"bijou-replay-event/1","seq":0,"tick":0}\n'
```

`append()` takes `{ tick, atMs, kind, payload }`, adds `schema` and the next
`seq` (from 0, no gaps), writes one line and returns the `seq`. It checks, in
this order, before a `seq` is used:

1. The input has exactly the fields `tick`, `atMs`, `kind` and `payload`.
2. `tick` and `atMs` are non-negative safe integers. The emitter rounds
   `atMs` down; the outbox does not round.
3. `kind` is one of the eight v1 kinds.
4. `payload` is a plain object, and every value in it is plain JSON data.

The outbox keeps append order and adds no other ordering rule. It does not
require `session` first or `end` last, and it does not check payload shapes
per kind: those are the emitter's contract, and the JSON Schema describes
them.

`events()` returns fresh copies parsed back from the recorded lines, so a
payload object changed after `append()` does not change the recording.

## Plain data

`canonicalJson()` validates and serializes in one pass. It rejects, with the
path of the value: `undefined`, functions, symbols, bigints, `NaN` and
infinities, class instances (`Date`, `Map`, `Set`, typed arrays and any other
prototype), arrays with holes or extra properties, symbol keys, accessor or
non-enumerable properties, and cycles. A null-prototype object is accepted,
and so is an object referenced from two places without a cycle.

The error message names the path and the kind of value. It never quotes the
rejected value.

## Bytes on the line

Each line is the canonical JSON of the whole envelope followed by `\n`:

- object keys sorted by Unicode code point (not UTF-16 code unit), at every
  depth, so the top-level order is `atMs`, `kind`, `payload`, `schema`,
  `seq`, `tick`;
- no insignificant whitespace;
- `-0` written as `0`;
- strings and numbers written as `JSON.stringify` writes them, which also
  escapes a lone surrogate as `\udxxx`, so every line is valid UTF-8;
- no byte-order mark, and the last line also ends with `\n`.

The memory and file outboxes share this serializer, so the same events give
the same bytes in both modes and on every run.

`surfaceFrameHash(frame)` is `sha256:` plus the hex SHA-256 of the UTF-8 bytes
of `canonicalJson({ width, height, styles, cells })`. It uses Bijou's pure
SHA-256, so it gives the same value in Node and in a browser.

## The file-backed outbox

`createReplayFileOutbox(path)` creates `path` exclusively. If the file exists,
it throws `open-failed` and leaves the file unchanged, so a second session
never writes `seq` 0 after an earlier stream. `{ overwrite: true }` replaces
the file. The outbox keeps no events in memory.

Each `append()` writes the whole line with synchronous writes, repeats a short
write until every byte is written, and calls `fsync` before it returns. A
crash therefore loses at most the event being written. A line is whole only
when its `\n` is present. An interrupted write can leave one unterminated
tail. After any write failure the outbox is `failed` and writes nothing more,
so that tail is never followed by another line. A reader treats a final
segment without `\n` as a truncated line, and a stream without `end` as a
truncated recording (DL-033).

## Errors

Every failure is a `ReplayOutboxError` with a `code` and a `path`:

| Code | When | State after |
| --- | --- | --- |
| `invalid-envelope` | A top-level field is missing, extra or malformed | unchanged |
| `non-plain-value` | A payload value is not plain JSON data | unchanged |
| `closed` | `append()` after `close()` | `closed` |
| `sink-failed` | The sink threw while writing or closing; `cause` holds the error (for example `ENOSPC`) | `failed` after a write |
| `failed` | `append()` after a `sink-failed` write | `failed` |
| `open-failed` | The file could not be created; `cause` holds the error (`EEXIST`, `ENOENT`, `EISDIR`) | no outbox |

A rejected append uses no `seq`. `close()` is idempotent and also releases the
file of a `failed` outbox.

The outbox never swallows an error, and `append()` throws synchronously, as
DL-033 decides. Keeping recording failures out of an application's update
loop is the emitter's job: DL-033 requires `runScript()` (#602) to keep the
first failure, stop recording and reject the recording call.
