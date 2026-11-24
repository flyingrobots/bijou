import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { loadCodeDojoDebtReport, type CodeDojoDebtReport } from './code-dojo-debt-report-build.js';
import { parseCodeDojoLiveInput, type CodeDojoLiveInput } from './code-dojo-debt-report-live.js';

export const DEFAULT_REPORT_PATH = 'docs/code-dojo/debt-report.json';
const EVENT_SCHEMA = { id: 'code-dojo.debt-report-event', version: '1.0.0' };

export interface CodeDojoReportRun {
  readonly code: number;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
}

class ReportError extends Error {
  constructor(readonly reason: string, message: string) {
    super(message);
  }
}

function line(fields: Record<string, unknown>): string {
  return JSON.stringify({ _schema: EVENT_SCHEMA, ...fields });
}

function optionValue(args: readonly string[], flag: string): string | null {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (value == null || value.startsWith('--')) throw new ReportError('bad-arguments', `${flag} requires a value`);
  return value;
}

function readLive(path: string | null, root: string): CodeDojoLiveInput | null {
  if (path == null) return null;
  const parsed: unknown = JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  return parseCodeDojoLiveInput(parsed);
}

function readStored(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function execute(args: readonly string[], root: string): CodeDojoReportRun {
  const livePath = optionValue(args, '--live-input');
  const out = optionValue(args, '--out');
  if (livePath != null && out == null) {
    throw new ReportError('live-needs-out', '--live-input requires --out and never overwrites the committed snapshot');
  }
  const target = resolve(root, out ?? DEFAULT_REPORT_PATH);
  const report: CodeDojoDebtReport = loadCodeDojoDebtReport(root, readLive(livePath, root));
  const text = `${JSON.stringify(report, null, 2)}\n`;
  const event = { path: out ?? DEFAULT_REPORT_PATH, totalViolations: report.totalViolations };

  if (args.includes('--check')) {
    if (readStored(target) !== text) {
      throw new ReportError('report-stale', `${event.path} is stale; run npm run code-dojo:report`);
    }
    return { code: 0, stdout: [line({ kind: 'report-current', ...event })], stderr: [] };
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, text);
  return { code: 0, stdout: [line({ kind: 'report-written', ...event })], stderr: [] };
}

/** Never throws: every failure becomes a schema'd error line on stderr. */
export function runCodeDojoDebtReport(args: readonly string[], root: string): CodeDojoReportRun {
  try {
    return execute(args, root);
  } catch (error) {
    const known = error instanceof ReportError;
    const message = error instanceof Error ? error.message : 'unknown failure';
    return {
      code: 1,
      stdout: [],
      stderr: [line({ kind: 'error', code: known ? error.reason : 'report-failed', message })],
    };
  }
}
