import { applyStyleFlag, MarkdownStyles } from './markdown-styles.js';

export const USAGE = 'Usage: npm run markdown-font -- <document.md> [--configure] [--h1-font "Family" --h1-size 32] [--h2-font ... --h2-size ...] [--h3-font ... --h3-size ...] [--h4-font ... --h4-size ...] [--p-font ... --p-size ...] [--font file.ttf | --google-font "Family Name" | --offline] [--no-animation] [--raster] [--width=80]';

export interface DemoOptions {
  readonly path: string;
  readonly fontPath?: string;
  readonly googleFamily?: string;
  readonly offline: boolean;
  readonly raster: boolean;
  readonly width?: number;
  readonly styles?: MarkdownStyles;
  readonly configure?: boolean;
  readonly animate?: boolean;
}

export function parseOptions(args: readonly string[]): DemoOptions {
  const [path, ...flags] = args;
  if (path === undefined || path.startsWith('--')) throw new Error(USAGE);
  let fontPath: string | undefined;
  let googleFamily: string | undefined;
  let offline = false;
  let raster = false;
  let width: number | undefined;
  let styles: MarkdownStyles | undefined;
  let configure = false;
  let animate = true;
  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];
    if (flag === '--raster') raster = true;
    else if (flag === '--configure') configure = true;
    else if (flag === '--no-animation') animate = false;
    else if (flag === '--offline') offline = true;
    else if (flag === '--font' || flag === '--google-font') {
      const value = flags[++i];
      if (value === undefined || value.startsWith('--') || value.trim() === '') throw new Error(USAGE);
      if (flag === '--font') fontPath = value;
      else googleFamily = value;
    } else if (flag !== undefined && /^--(?:h[1-4]|p)-(?:font|size)$/u.test(flag)) {
      const value = flags[++i];
      if (value === undefined || value.startsWith('--')) throw new Error(USAGE);
      styles = applyStyleFlag(styles ?? new MarkdownStyles(), flag, value);
    } else if (flag?.startsWith('--width=')) {
      width = Number(flag.slice(8));
      if (!Number.isInteger(width) || width < 1 || width > 240) throw new Error('Width must be 1–240 columns.');
    } else throw new Error(USAGE);
  }
  if (Number(fontPath !== undefined) + Number(googleFamily !== undefined) + Number(offline) > 1) {
    throw new Error('Choose one of --font, --google-font, or --offline.');
  }
  return { path, offline, raster,
    ...(fontPath === undefined ? {} : { fontPath }),
    ...(googleFamily === undefined ? {} : { googleFamily }),
    ...(width === undefined ? {} : { width }),
    ...(styles === undefined ? {} : { styles }),
    ...(configure ? { configure } : {}),
    animate,
  };
}
