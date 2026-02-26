# Architecture — @flyingrobots/bijou-node

## Overview

bijou-node is the official Node.js adapter for `@flyingrobots/bijou`. It implements the three port interfaces using Node.js built-ins and chalk.

## Port Mapping

```
┌──────────────────────────────────────────────┐
│  @flyingrobots/bijou (ports)                 │
│                                              │
│  RuntimePort    IOPort        StylePort      │
└──────┬───────────┬──────────────┬────────────┘
       │           │              │
┌──────▼───────────▼──────────────▼────────────┐
│  @flyingrobots/bijou-node (adapters)         │
│                                              │
│  nodeRuntime()   nodeIO()      chalkStyle()  │
│  ├─ process.env  ├─ stdout     ├─ chalk.rgb  │
│  ├─ stdout.isTTY ├─ stdin      ├─ chalk.hex  │
│  ├─ stdin.isTTY  ├─ readline   └─ chalk.bold │
│  ├─ columns      ├─ rawMode                  │
│  └─ rows         ├─ resize                   │
│                   ├─ fs.read                  │
│                   └─ path.join               │
└──────────────────────────────────────────────┘
```

### nodeRuntime()

Maps `RuntimePort` to `process`:

| Port method | Node.js API |
|---|---|
| `env(key)` | `process.env[key]` |
| `stdoutIsTTY` | `process.stdout.isTTY` |
| `stdinIsTTY` | `process.stdin.isTTY` |
| `columns` | `process.stdout.columns` (live getter, defaults to 80) |
| `rows` | `process.stdout.rows` (live getter, defaults to 24) |

### nodeIO()

Maps `IOPort` to Node.js I/O:

| Port method | Node.js API |
|---|---|
| `write(data)` | `process.stdout.write(data)` |
| `question(prompt)` | `readline.createInterface` + `rl.question` |
| `rawInput(onKey)` | `stdin.setRawMode(true)` + `stdin.on('data')` |
| `onResize(cb)` | `stdout.on('resize')` → `cb(columns, rows)` |
| `setInterval(cb, ms)` | `globalThis.setInterval` |
| `readFile(path)` | `fs.readFileSync(path, 'utf8')` |
| `readDir(path)` | `fs.readdirSync(path)` |
| `joinPath(...segs)` | `path.join(...segs)` |

### chalkStyle()

Maps `StylePort` to chalk:

| Port method | chalk API |
|---|---|
| `styled(token, text)` | `chalk.rgb(r,g,b)` + modifiers (`bold`, `italic`, etc.) |
| `rgb(r, g, b, text)` | `chalk.rgb(r, g, b)(text)` |
| `hex(color, text)` | `chalk.hex(color)(text)` |
| `bold(text)` | `chalk.bold(text)` |

Respects `NO_COLOR` — when active, all methods return text unchanged.

## Context Factory

`createNodeContext()` assembles the three adapters into a `BijouContext`:

1. Creates `nodeRuntime()`, `nodeIO()`, `chalkStyle()`
2. Detects output mode from runtime state (TTY, CI, TERM, BIJOU_ACCESSIBLE)
3. Resolves theme from `BIJOU_THEME` env var or falls back to default preset
4. Returns a frozen `BijouContext` object

`initDefaultContext()` calls `createNodeContext()` and registers the result as the global default via `setDefaultContext()`.

## Directory Structure

```
src/
├── index.ts    # Public API: exports all adapters + context factories
├── runtime.ts  # nodeRuntime() implementation
├── io.ts       # nodeIO() implementation
└── style.ts    # chalkStyle() implementation
```
