import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { loadFont } from './load-font.js';
import { parseOptions, USAGE } from './options.js';
import { readBoundedFile } from './read-file.js';
import { renderMarkdownFont } from './render.js';

export async function main(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log(USAGE);
    return;
  }
  const options = parseOptions(args);
  const ctx = initDefaultContext();
  const width = options.width ?? Math.min(100, Math.max(1, ctx.runtime.columns));
  const raster = ctx.mode !== 'accessible' && (options.raster || ctx.mode === 'interactive' || ctx.mode === 'static');
  const source = new TextDecoder().decode(await readBoundedFile(resolve(options.path), 1_048_576));
  const font = raster ? await loadFont(options, ctx) : undefined;
  console.log(renderMarkdownFont(source, ctx, { width, raster, fontForText: (text) => font?.forText(text) }));
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
