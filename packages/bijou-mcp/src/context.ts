/**
 * Shared Bijou context for MCP tool rendering.
 *
 * Uses `createTestContext` with `mode: 'interactive'` to get Unicode
 * box-drawing layout. The default `plainStyle()` strips all ANSI escape
 * codes, producing clean structured text that renders in any monospace
 * context (chat, markdown, logs).
 */

import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { BijouContext } from '@flyingrobots/bijou';

export function mcpContext(columns: number = 80): BijouContext {
  return createTestContext({
    mode: 'interactive',
    runtime: { columns },
  });
}
