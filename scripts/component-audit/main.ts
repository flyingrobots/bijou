import '../docker-seal/require-docker.mjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { COMPONENT_STORIES } from '../../examples/docs/stories.js';
import { findStoryIndex } from '../../examples/components/library-cli.js';
import { findingsFor } from './checks.js';
import { allCombos, MODES, renderCombo, THEMES, type Combo } from './render.js';
import { errorKey, matrixReport, reportCard, type Audited } from './report.js';

/*
 * Component audit. One combination prints its report card:
 *   npm run audit:components -- --component alert --variant warning --mode static --theme book --scheme light
 * Every combination writes one Markdown report and compares its errors with the baseline:
 *   npm run audit:components -- --all [--out=path.md] [--check] [--write-baseline]
 * --check exits 1 when an error is not in the baseline (warnings never fail); --write-baseline records the
 * current errors. The baseline is a ratchet: entries may be removed as errors are fixed, never added casually.
 */
const BASELINE = new URL('./baseline.json', import.meta.url);
const argv = process.argv.slice(2);
const flag = (name: string): boolean => argv.includes(`--${name}`);
const value = (name: string): string | undefined => {
  const i = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i < 0) return undefined;
  const arg = argv[i] ?? '';
  return arg.includes('=') ? arg.split('=').slice(1).join('=') : argv[i + 1];
};
const stories: readonly Combo['story'][] = COMPONENT_STORIES;
const audit = (combo: Combo): Audited => {
  const rendered = renderCombo(combo);
  return { rendered, findings: findingsFor(rendered) };
};

if (!flag('all')) {
  const index = findStoryIndex(value('component') ?? '');
  const story = stories[index];
  if (story === undefined) {
    process.stderr.write('Pass --component <name> (with optional --variant, --mode, --theme, --scheme), or --all.\n');
    process.exit(2);
  }
  const wanted = value('variant');
  const variantIndex = wanted === undefined ? 0 : story.variants.findIndex((v) => v.id === wanted || v.label.toLowerCase() === wanted.toLowerCase());
  const mode = MODES.find((m) => m === (value('mode') ?? 'interactive'));
  const theme = THEMES.find((t) => t.theme === (value('theme') ?? THEMES[0]?.theme) && t.scheme === (value('scheme') ?? 'dark')) ?? THEMES[0];
  if (variantIndex < 0 || mode === undefined || theme === undefined) {
    process.stderr.write(`Unknown variant, mode, or theme. Modes: ${MODES.join(', ')}. Themes: ${THEMES.map((t) => `${t.theme}/${t.scheme}`).join(', ')}.\n`);
    process.exit(2);
  }
  const card = audit({ story, variantIndex, mode, ...theme });
  process.stdout.write(`${reportCard(card)}\n`);
  process.exit(card.findings.some((f) => f.severity === 'error') ? 1 : 0);
}

const results = allCombos(stories).map(audit);
const errors = results.flatMap((a) => a.findings.filter((f) => f.severity === 'error').map((f) => errorKey(a, f)));
const stored: unknown = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : [];
const baseline = new Set<string>(Array.isArray(stored) ? stored.filter((k): k is string => typeof k === 'string') : []);
const fresh = new Set(errors.filter((key) => !baseline.has(key)));
const fixed = [...baseline].filter((key) => !errors.includes(key));
const out = value('out') ?? 'audit/component-audit.md';
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, matrixReport(results, fresh));
const warnings = results.reduce((n, a) => n + a.findings.filter((f) => f.severity === 'warning').length, 0);
process.stderr.write(`audited ${String(results.length)} combinations: ${String(errors.length)} errors (${String(fresh.size)} new), ${String(warnings)} warnings; wrote ${out}\n`);
if (fixed.length > 0) process.stderr.write(`${String(fixed.length)} baseline errors are fixed; run --write-baseline to shrink the baseline.\n`);
if (flag('write-baseline')) {
  writeFileSync(BASELINE, `${JSON.stringify([...new Set(errors)].sort(), null, 2)}\n`);
  process.stderr.write(`wrote ${BASELINE.pathname} with ${String(new Set(errors).size)} errors\n`);
} else if (flag('check') && fresh.size > 0) {
  process.stderr.write(`New errors not in the baseline:\n${[...fresh].map((k) => `  ${k}`).join('\n')}\n`);
  process.exit(1);
}
