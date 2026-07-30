import { TRANCHE_E_ROOTS } from './tranche-e-contract.js';

export const TRANCHE_E_FAMILY_MEMBERS = {
  'packages/bijou-tui/src/runtime-engine.ts': [
    'packages/bijou-tui/src/runtime-engine.ts',
  ],
  'packages/bijou/src/core/components/table.ts': [
    'packages/bijou/src/core/components/table.ts',
  ],
  'packages/bijou-tui/src/app-frame.ts': [
    'packages/bijou-tui/src/app-frame.ts',
  ],
  'examples/docs/app.ts': ['examples/docs/app.ts'],
  'examples/docs/stories.ts': ['examples/docs/stories.ts'],
} as const satisfies Readonly<
  Record<(typeof TRANCHE_E_ROOTS)[number], readonly string[]>
>;
