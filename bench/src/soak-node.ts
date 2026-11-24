import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveSoakOptions, type SoakHost, type SoakLogSink, type SoakMemoryPort, type SoakOptions } from './soak-ports.js';

/** Today's `npm run soak` arguments: `--cycles=`, `--fps=`, `--dwell=` and `--out=`. */
export function parseSoakArgs(args: readonly string[]): { readonly options: SoakOptions; readonly out: string } {
  const value = (name: string): string | undefined => {
    const prefix = `--${name}=`;
    return args.find((a) => a.startsWith(prefix))?.slice(prefix.length);
  };
  const num = (name: string): number | undefined => {
    const raw = value(name);
    if (raw === undefined) return undefined;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : undefined;
  };
  return { options: resolveSoakOptions({ cycles: num('cycles'), fps: num('fps'), dwell: num('dwell') }), out: resolve(value('out') ?? 'bench/soak.jsonl') };
}

const megabytes = (bytes: number): number => Math.round(bytes / 1024 / 1024 * 10) / 10;

export const nodeMemory: SoakMemoryPort = () => {
  const mem = process.memoryUsage();
  return { heapUsedMB: megabytes(mem.heapUsed), rssMB: megabytes(mem.rss) };
};

/** Creates the log file when absent, then appends one line per call. */
export function fileLogSink(path: string): SoakLogSink {
  if (!existsSync(path)) writeFileSync(path, '');
  return (line) => { appendFileSync(path, `${line}\n`); };
}

export function createNodeSoakHost(args: readonly string[]): SoakHost {
  const { options, out } = parseSoakArgs(args);
  return { options, memory: nodeMemory, log: fileLogSink(out) };
}
