/**
 * Shared Bijou context for MCP tool rendering.
 *
 * Uses `createTestContext` with `mode: 'interactive'` to get Unicode
 * box-drawing layout. The default `plainStyle()` adds no styling escapes.
 * Components that generate terminal controls independently, such as hyperlinks,
 * must explicitly select their plain-text fallback for chat, Markdown and logs.
 */

import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import type { BijouContext } from '@flyingrobots/bijou';

export function mcpContext(columns = 80): BijouContext {
  return createTestContext({
    mode: 'interactive',
    runtime: { columns },
  });
}
