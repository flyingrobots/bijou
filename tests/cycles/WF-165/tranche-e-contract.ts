import { TRANCHE_E_FRAME_EXPORTS } from './tranche-e-contract-frame.js';
import {
  TRANCHE_E_DOCS_APP_EXPORTS,
  TRANCHE_E_STORIES_EXPORTS,
  TRANCHE_E_TABLE_EXPORTS,
} from './tranche-e-contract-other.js';
import { TRANCHE_E_RUNTIME_EXPORTS } from './tranche-e-contract-runtime.js';

export const TRANCHE_E_ROOTS = [
  'packages/bijou-tui/src/runtime-engine.ts',
  'packages/bijou/src/core/components/table.ts',
  'packages/bijou-tui/src/app-frame.ts',
  'examples/docs/app.ts',
  'examples/docs/stories.ts',
] as const;

export const TRANCHE_E_PUBLIC_EXPORTS = {
  'packages/bijou-tui/src/runtime-engine.ts': TRANCHE_E_RUNTIME_EXPORTS,
  'packages/bijou/src/core/components/table.ts': TRANCHE_E_TABLE_EXPORTS,
  'packages/bijou-tui/src/app-frame.ts': TRANCHE_E_FRAME_EXPORTS,
  'examples/docs/app.ts': TRANCHE_E_DOCS_APP_EXPORTS,
  'examples/docs/stories.ts': TRANCHE_E_STORIES_EXPORTS,
} as const satisfies Readonly<Record<
  (typeof TRANCHE_E_ROOTS)[number],
  readonly string[]
>>;
