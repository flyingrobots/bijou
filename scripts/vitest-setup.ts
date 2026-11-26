// Runs before every test file. Most files share their worker's modules (see
// needsIsolation in scripts/vitest-shards.mjs), so the default context one file
// leaves behind is still there when the next file starts, and framework code
// that falls back to it then behaves differently. Shell quit policy is one
// case: a leftover pipe-mode context makes `q` quit where the app's own
// interactive context would ask first. Every file therefore starts with no
// default context, as it does when it runs alone.
import { _resetDefaultContextForTesting } from '@flyingrobots/bijou/adapters/test';

_resetDefaultContextForTesting();
