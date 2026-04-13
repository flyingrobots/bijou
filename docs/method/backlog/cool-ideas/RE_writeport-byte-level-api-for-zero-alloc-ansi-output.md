---
title: WritePort byte-level API for zero-alloc ANSI output
legend: RE
lane: cool-ideas
---

# WritePort byte-level API for zero-alloc ANSI output

Extend WritePort to accept Uint8Array bytes alongside strings. The differ could then write ANSI escape sequences directly as bytes into a pre-allocated output buffer, avoiding string construction entirely. V8's rope string optimization makes string += competitive for now, but a byte-level path would eliminate the ~365KB/frame of transient string allocation in the gradient worst case. Requires: WritePort.writeBytes(buf: Uint8Array, length: number), differ output buffer as Uint8Array, ANSI SGR sequences written as raw bytes. Discovered during RE-008/RE-009 investigation — chunks.push+join was slower than +=, so the byte path is the only remaining win.
