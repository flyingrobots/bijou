# Bad Code Backlog

Entries logged by EXPERT Bijou BigBro.

## 2026-04-26

### [Severity: Low] Loose Typing in `StartAppOptions`
- **Location:** `packages/bijou-node/src/index.ts`
- **Anti-pattern:** `export type StartAppOptions<M = any> = RunOptions<M> & NodeThemeOptions;`
- **Rationale:** The use of `any` as a default for the message type `M` weakens the type safety of the TEA loop. While it provides convenience for quick scripts, industrial-grade applications should require explicit message types to prevent "side-effect soup" and ensure the `update` function remains a pure, predictable state transformer.
- **Refactor Suggestion:** Change the default to `never` or `unknown` to force callers to specify their message type, or provide a strictly typed internal `DefaultMsg` for the simple cases.
