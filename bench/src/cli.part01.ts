import {
  parseScenarioTagGroup,
  type ScenarioTagGroup,
} from './scenarios/index.js';
import { formatReportAsJsonl } from './harnesses/wall-time/format-jsonl.js';
import { type RunReport } from './harnesses/wall-time/runner.js';

export type BenchOutputFormat = 'summary' | 'json' | 'jsonl';
/**
 * Parse `--key=value`, `--key value`, and bare `--flag` forms.
 * Unknown positional args are returned from `positional()` below.
 */
export function parseKv(argv: readonly string[]): Map<string, string> {
  const out = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      out.set(arg.slice(2, eq), arg.slice(eq + 1));
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next != null && !next.startsWith('--')) {
      out.set(key, next);
      i++; // consume the value
    } else {
      out.set(key, 'true');
    }
  }
  return out;
}
export function flagValues(argv: readonly string[], key: string): string[] {
  const values: string[] = [];
  const longFlag = `--${key}`;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (arg === longFlag) {
      const next = argv[i + 1];
      if (next != null && !next.startsWith('--')) {
        values.push(next);
        i++;
      }
      continue;
    }
    if (arg.startsWith(`${longFlag}=`)) {
      values.push(arg.slice(longFlag.length + 1));
    }
  }

  return values;
}
export function parseTagGroups(
  argv: readonly string[],
): readonly ScenarioTagGroup[] {
  return flagValues(argv, 'tag').map(parseScenarioTagGroup);
}
export function formatTagGroups(
  tagGroups: readonly ScenarioTagGroup[],
): string {
  return tagGroups.map((group) => group.join('+')).join('|');
}
export function parseOutputFormat(
  value: string | undefined,
): BenchOutputFormat {
  if (value == null || value === 'summary') return 'summary';
  if (value === 'json') return 'json';
  if (value === 'jsonl' || value === 'flat') return 'jsonl';
  throw new Error(
    `invalid --format: ${value} (expected summary, json, or jsonl)`,
  );
}
export function fileFormatForOutput(
  format: BenchOutputFormat,
): Exclude<BenchOutputFormat, 'summary'> {
  return format === 'summary' ? 'json' : format;
}
export function defaultOutExtension(
  format: Exclude<BenchOutputFormat, 'summary'>,
): string {
  return format === 'jsonl' ? 'jsonl' : 'json';
}
export function renderStructuredReport(
  report: RunReport,
  format: Exclude<BenchOutputFormat, 'summary'>,
): string {
  return format === 'json'
    ? JSON.stringify(report, null, 2) + '\n'
    : formatReportAsJsonl(report);
}
export function positional(argv: readonly string[]): string[] {
  // Positionals are non-flag args that are not consumed as values for
  // preceding `--key value` flags. We walk the argv mirroring parseKv's
  // consumption so positionals are identified correctly.
  const result: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (!arg.startsWith('--')) {
      result.push(arg);
      continue;
    }
    if (arg.includes('=')) continue;
    // Bare --flag: if the next arg is a value (not another flag),
    // skip it as parseKv consumed it.
    const next = argv[i + 1];
    if (next != null && !next.startsWith('--')) {
      i++; // skip value
    }
  }
  return result;
}
