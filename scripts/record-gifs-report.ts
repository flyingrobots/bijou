import { alert, table, type BijouContext } from '@flyingrobots/bijou';

export interface RecordResult {
  readonly name: string;
  readonly status: 'success' | 'error';
  readonly elapsed: number;
}

export function renderRecordSummary(
  results: readonly RecordResult[],
  context: BijouContext,
): void {
  const ordered = [...results].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  console.log(
    table({
      columns: [
        { header: 'Example' },
        { header: 'Status' },
        { header: 'Time', align: 'right' as const },
      ],
      rows: ordered.map((result) => [
        result.name,
        result.status === 'success' ? '✅' : '❌',
        `${(result.elapsed / 1000).toFixed(1)}s`,
      ]),
      ctx: context,
    }),
  );
  console.log();

  const failures = ordered.filter((result) => result.status === 'error');
  if (failures.length > 0) {
    console.log(
      alert(formatFailures(failures), {
        variant: 'error',
        ctx: context,
      }),
    );
    return;
  }

  const totalTime = ordered.reduce((sum, result) => sum + result.elapsed, 0);
  const wallTime = Math.max(...ordered.map((result) => result.elapsed));
  console.log(
    alert(
      `All ${String(ordered.length)} GIFs recorded (${(totalTime / 1000).toFixed(1)}s total, ${(wallTime / 1000).toFixed(1)}s wall)`,
      { variant: 'success', ctx: context },
    ),
  );
}

function formatFailures(failures: readonly RecordResult[]): string {
  const lines = [`${String(failures.length)} failed:`];
  let line = ' ';
  for (const { name } of failures) {
    if (line.length + name.length + 2 > 70) {
      lines.push(line);
      line = `  ${name},`;
    } else {
      line += ` ${name},`;
    }
  }
  lines.push(line.replace(/,$/, ''));
  return lines.join('\n');
}
