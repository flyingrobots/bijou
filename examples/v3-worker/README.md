# `v3-worker`

Canonical worker-runtime demo for V3.

It proves:
- `runInWorker()` and `startWorkerApp()` via public package exports,
- synchronous heavy work happens in the worker thread instead of the main TTY thread,
- the custom main-to-worker data channel reaches the app update loop,
- the worker can emit structured messages back to the main thread.

Run it with:

```bash
npx tsx examples/v3-worker/main.ts
```

What to look for:
- after startup, the host note updates from the main thread,
- `SPACE` runs a heavy task without freezing the shell chrome,
- the worker reports completion back to the main thread,
- `q` exits.
