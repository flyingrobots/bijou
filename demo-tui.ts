/**
 * Bijou canonical runtime demo.
 *
 * This demo runs a multi-page app shell using createFramedApp() with:
 * - grid + nested split layouts
 * - per-pane scroll isolation
 * - frame help + command palette
 * - panel-scoped drawers in all anchors (left/right/top/bottom)
 *
 * Run: npx tsx demo-tui.ts
 */

import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { createCanonicalWorkbenchApp } from './examples/_shared/canonical-app.ts';

const ctx = initDefaultContext();

run(createCanonicalWorkbenchApp(ctx));
