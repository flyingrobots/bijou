import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run } from '@flyingrobots/bijou-tui';
import { createDocumentAnimation } from './animate-document.js';
import { configureStyles } from './configure-styles.js';
import { loadStyles } from './load-styles.js';
import { MarkdownStyles } from './markdown-styles.js';
import { parseOptions, USAGE } from './options.js';
import { readBoundedFile } from './read-file.js';
import { renderMarkdownFont, renderMarkdownParts, type MarkdownFontOptions } from './render.js';

export async function main(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log(USAGE);
    return;
  }
  const options = parseOptions(args);
  const ctx = initDefaultContext();
  if (options.configure === true && (!ctx.runtime.stdinIsTTY || ctx.mode !== 'interactive')) {
    throw new Error('--configure requires an interactive terminal. Use --h1-font/--h1-size and the other element flags for scripted runs.');
  }
  const width = options.width ?? Math.min(100, Math.max(1, ctx.runtime.columns));
  const raster = ctx.mode !== 'accessible' && (options.raster || ctx.mode === 'interactive' || ctx.mode === 'static');
  const source = new TextDecoder().decode(await readBoundedFile(resolve(options.path), 1_048_576));
  const initial = options.styles ?? new MarkdownStyles();
  const styles = options.configure === true ? await configureStyles(ctx, initial) : initial;
  const fonts = raster ? await loadStyles(options, styles, ctx) : undefined;
  const renderOptions: MarkdownFontOptions = {
    width, raster, styles,
    fontForText: (text, element) => fonts?.get(styles.for(element).font)?.forText(text),
  };
  const animated = options.animate !== false && ctx.mode === 'interactive'
    && ctx.runtime.stdinIsTTY && ctx.runtime.stdoutIsTTY && !ctx.theme.noColor;
  if (animated) {
    await run(createDocumentAnimation((columns) => renderMarkdownParts(source, ctx, { ...renderOptions, width: columns }), ctx, width), { ctx, mouse: true });
  } else console.log(renderMarkdownFont(source, ctx, renderOptions));
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
