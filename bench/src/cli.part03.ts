import { resolve } from 'node:path';
import { listScenarioIds } from './scenarios/index.js';
import { readBenchReport } from './harnesses/wall-time/read-report.js';
import {
  compareReports,
  formatComparison,
} from './harnesses/wall-time/compare.js';
import { positional } from './cli.part01.js';
import { cmdList, cmdRun } from './cli.part02.js';

export function cmdCompare(argv: readonly string[]): void {
  const positionals = positional(argv);
  if (positionals.length < 2) {
    throw new Error('usage: bench compare <baseline.json> <current.json>');
  }
  const [baselineArg, currentArg] = positionals;
  if (baselineArg === undefined || currentArg === undefined) {
    throw new Error('usage: bench compare <baseline.json> <current.json>');
  }
  const baselinePath = resolve(process.cwd(), baselineArg);
  const currentPath = resolve(process.cwd(), currentArg);
  const baseline = readBenchReport(baselinePath);
  const current = readBenchReport(currentPath);
  const comparison = compareReports(baseline, current);
  process.stdout.write(formatComparison(comparison) + '\n');
}
export function main(): void {
  const argv = process.argv.slice(2);
  const [subcommand, ...rest] = argv;

  if (subcommand == null || subcommand === '--help' || subcommand === '-h') {
    process.stdout.write(
      [
        'bijou-bench — performance harness',
        '',
        'usage:',
        '  bench run [--scenario=ID|all] [--tag=TAG[,TAG]] [--samples=30] [--warmup=N] [--frames=N] [--format=summary|json|jsonl] [--out=path]',
        '  bench compare <baseline.json> <current.json>',
        '  bench list [--tag=TAG[,TAG]]',
        '',
        'Formats: summary=human table (default), json=nested bench.v2, jsonl=flat metric records.',
        'Tag filters: comma-separated tags are AND within one --tag, repeated --tag flags are OR across groups.',
        `scenarios: ${listScenarioIds().join(', ')}`,
      ].join('\n') + '\n',
    );
    return;
  }

  switch (subcommand) {
    case 'run':
      cmdRun(rest);
      break;
    case 'compare':
      cmdCompare(rest);
      break;
    case 'list':
      cmdList(rest);
      break;
    default:
      throw new Error(`unknown subcommand: ${subcommand}`);
  }
}
