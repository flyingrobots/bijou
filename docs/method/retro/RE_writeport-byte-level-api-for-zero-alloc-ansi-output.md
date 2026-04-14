---
title: WritePort byte-level API for zero-alloc ANSI output
lane: retro
legend: RE
---

# WritePort byte-level API for zero-alloc ANSI output

## Disposition

This is already repo truth and no longer belongs in the live backlog.
`WritePort.writeBytes(buf, len)` is part of the public core I/O contract,
`nodeIO()` implements it for `process.stdout`, and the byte-path differ uses
it when available before falling back to string writes. The remaining work in
this area is no longer “add the API,” but deeper output-path refinements on
top of the byte writer that already shipped.

## Original Proposal

Legend: [RE — Runtime Engine](../legends/RE-runtime-engine.md)

Extend WritePort to accept Uint8Array bytes alongside strings. The differ could then write ANSI escape sequences directly as bytes into a pre-allocated output buffer, avoiding string construction entirely. V8's rope string optimization makes string += competitive for now, but a byte-level path would eliminate the ~365KB/frame of transient string allocation in the gradient worst case. Requires: WritePort.writeBytes(buf: Uint8Array, length: number), differ output buffer as Uint8Array, ANSI SGR sequences written as raw bytes. Discovered during RE-008/RE-009 investigation — chunks.push+join was slower than +=, so the byte path is the only remaining win.
