import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { BIJOU_VERSION } from '../../../examples/docs/app-ids.js';
import { BIJOU_RELEASE_LINE, releaseLineOf } from '../../../examples/docs/app-release-line.js';
import { defaultMarkdownTemplateValues } from '../../../examples/docs/i18n-debt-io.js';
import { collectDogfoodMarkdownLocalizationDebt } from '../../../examples/docs/i18n-debt-markdown-ratchet.js';

/**
 * Release docs live under `docs/releases/<line>/`, never
 * `docs/releases/<exact-version>/`.
 *
 * Cutting `8.0.0-rc.1` was the first prerelease this code had seen, and the
 * DOGFOOD docs app crashed on startup: it read the raw version, so it looked for
 * a `docs/releases/8.0.0-rc.1/` directory that does not and should not exist. A
 * prerelease is a candidate *for* a line and shares its What's New and migration
 * guide, and `release:readiness` keys the evidence-packet path off the target
 * milestone, which is the line too.
 *
 * The failure mode is worth naming: it was not a bad render, it was an
 * unhandled ENOENT before the first frame, surfaced only by `smoke:dogfood`
 * exiting 1 with no message about why.
 */
describe('DX-052 DOGFOOD resolves release docs by release line', () => {
  it('strips a prerelease suffix from the release line', () => {
    const strip = releaseLineOf;
    expect(strip('8.0.0-rc.1')).toBe('8.0.0');
    expect(strip('8.0.0-beta.12')).toBe('8.0.0');
    expect(strip('8.0.0-alpha.1')).toBe('8.0.0');
    expect(strip('8.0.0')).toBe('8.0.0');
  });

  it('leaves a stable version untouched', () => {
    if (!BIJOU_VERSION.includes('-')) {
      expect(BIJOU_RELEASE_LINE).toBe(BIJOU_VERSION);
    } else {
      expect(BIJOU_RELEASE_LINE).not.toBe(BIJOU_VERSION);
      expect(BIJOU_VERSION.startsWith(`${BIJOU_RELEASE_LINE}-`)).toBe(true);
    }
  });

  it('resolves to release docs that actually exist', () => {
    // The assertion that would have caught the crash: the derived path must be
    // on disk, checked without booting the app.
    const root = resolve(import.meta.dirname, '../../..');
    for (const name of ['whats-new.md', 'migration-guide.md', 'README.md']) {
      const path = resolve(root, 'docs/releases', BIJOU_RELEASE_LINE, name);
      expect(existsSync(path), `${path} is missing`).toBe(true);
    }
  });

  it('the i18n scanner can resolve every token the docs app templates with', () => {
    // Not a style point. The scanner turns templated path literals into real
    // files to check, and an unresolvable token makes documents vanish from the
    // inventory rather than fail loudly. Moving `app-content.ts` from
    // `${BIJOU_VERSION}` to `${BIJOU_RELEASE_LINE}` dropped the release What's
    // New and migration guide and took measured Markdown debt from 78 to 72 —
    // reading as a six-point improvement while two documents went unwatched.
    const values = defaultMarkdownTemplateValues();
    expect(Object.keys(values)).toContain('BIJOU_VERSION');
    expect(Object.keys(values)).toContain('BIJOU_RELEASE_LINE');
    expect(values['BIJOU_RELEASE_LINE']).toBe(releaseLineOf(BIJOU_VERSION));
  });

  it('keeps the release docs inside the localization inventory', () => {
    const inventory = collectDogfoodMarkdownLocalizationDebt();
    const paths = inventory.documents.map((d) => (d as { path: string }).path);
    expect(paths).toContain(`docs/releases/${BIJOU_RELEASE_LINE}/whats-new.md`);
    expect(paths).toContain(`docs/releases/${BIJOU_RELEASE_LINE}/migration-guide.md`);
  });
});
