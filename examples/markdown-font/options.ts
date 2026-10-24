export const USAGE = 'Usage: npm run markdown-font -- <document.md> [--font file.ttf | --google-font "Family Name" | --offline] [--raster] [--width=80]';

export interface DemoOptions {
  readonly path: string;
  readonly fontPath?: string;
  readonly googleFamily?: string;
  readonly offline: boolean;
  readonly raster: boolean;
  readonly width?: number;
}

export function parseOptions(args: readonly string[]): DemoOptions {
  const [path, ...flags] = args;
  if (path === undefined || path.startsWith('--')) throw new Error(USAGE);
  let fontPath: string | undefined;
  let googleFamily: string | undefined;
  let offline = false;
  let raster = false;
  let width: number | undefined;
  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];
    if (flag === '--raster') raster = true;
    else if (flag === '--offline') offline = true;
    else if (flag === '--font' || flag === '--google-font') {
      const value = flags[++i];
      if (value === undefined || value.startsWith('--') || value.trim() === '') throw new Error(USAGE);
      if (flag === '--font') fontPath = value;
      else googleFamily = value;
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
  };
}
