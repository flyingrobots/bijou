import type { BijouContext } from '@flyingrobots/bijou';
import type { App } from '@flyingrobots/bijou-tui';
import type { BrowserLocalePort } from './browser-locale.js';

// The one function the showcase takes from examples/docs/app.ts. DOGFOOD is
// compiled by the repository's own tsconfig; this describes it to the
// showcase's stricter one, which would otherwise read all of DOGFOOD.
// tests/web-gpu/dogfood-locale.test.ts checks the port against DOGFOOD's.
export function createDocsApp(ctx: BijouContext, options?: { readonly localePort?: BrowserLocalePort }): App<unknown, unknown>;
