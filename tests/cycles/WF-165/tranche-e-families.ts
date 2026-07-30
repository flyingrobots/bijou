import { TRANCHE_E_ROOTS } from "./tranche-e-contract.js";

export const TRANCHE_E_FAMILY_MEMBERS = {
  "packages/bijou-tui/src/runtime-engine.ts": [
    "packages/bijou-tui/src/runtime-engine.ts",
    "packages/bijou-tui/src/runtime-engine-state.ts",
    "packages/bijou-tui/src/runtime-engine-view-stack.ts",
    "packages/bijou-tui/src/runtime-engine-layouts.ts",
    "packages/bijou-tui/src/runtime-engine-input.ts",
    "packages/bijou-tui/src/runtime-engine-component-layout.ts",
    "packages/bijou-tui/src/runtime-engine-component-contract.ts",
    "packages/bijou-tui/src/runtime-engine-hit-test.ts",
    "packages/bijou-tui/src/runtime-engine-route.ts",
    "packages/bijou-tui/src/runtime-engine-buffers.ts",
    "packages/bijou-tui/src/runtime-engine-component-create.ts",
    "packages/bijou-tui/src/runtime-engine-component-input.ts",
  ],
  "packages/bijou/src/core/components/table.ts": [
    "packages/bijou/src/core/components/table.ts",
  ],
  "packages/bijou-tui/src/app-frame.ts": [
    "packages/bijou-tui/src/app-frame.ts",
  ],
  "examples/docs/app.ts": ["examples/docs/app.ts"],
  "examples/docs/stories.ts": ["examples/docs/stories.ts"],
} as const satisfies Readonly<
  Record<(typeof TRANCHE_E_ROOTS)[number], readonly string[]>
>;
