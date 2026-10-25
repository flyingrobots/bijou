import { createHash } from 'node:crypto';
import { filter, type BijouContext } from '@flyingrobots/bijou';
import { FontRasterizer } from './font-rasterizer.js';
import { googleFamilies, googleFont } from './google-fonts.js';
import { readBoundedFile } from './read-file.js';
import type { DemoOptions } from './options.js';

export async function chooseGoogleFont(ctx: BijouContext, families: readonly string[]): Promise<string> {
  const ordered = ['Space Grotesk', ...families.filter((family) => family !== 'Space Grotesk')];
  return filter({
    title: 'Google Fonts — type to search, arrows to move, Enter to choose',
    options: ordered.map((family) => ({ label: family, value: family })),
    defaultValue: 'Space Grotesk', maxVisible: 8, ctx,
  });
}

export async function loadFont(options: DemoOptions, ctx: BijouContext): Promise<FontRasterizer> {
  if (options.fontPath !== undefined) {
    return new FontRasterizer(await readBoundedFile(options.fontPath, 8_388_608), options.fontPath);
  }
  let family = options.googleFamily;
  if (family === undefined && !options.offline && ctx.mode === 'interactive' && ctx.runtime.stdinIsTTY) {
    ctx.io.write('Downloading the Google Fonts family list…\n');
    family = await chooseGoogleFont(ctx, await googleFamilies());
  }
  if (family !== undefined && family !== 'Space Grotesk') {
    ctx.io.write(`Downloading ${family}…\n`);
    return new FontRasterizer(await googleFont(family), family);
  }
  const bytes = await readBoundedFile(new URL('../../assets/fonts/space-grotesk/SpaceGrotesk.ttf', import.meta.url), 8_388_608);
  if (createHash('sha256').update(bytes).digest('hex') !== 'acad6de1fc93436f5c0f1f4137751ef04f1aea3063e7036535970ffcfbd79f72') {
    throw new Error('Space Grotesk font digest mismatch.');
  }
  return new FontRasterizer(bytes, 'Space Grotesk');
}
