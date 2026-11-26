import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..');
const FONT_DIR = join(ROOT, 'assets', 'fonts', 'space-mono');
const read = (...parts: string[]): string => readFileSync(join(ROOT, ...parts), 'utf8');

/** The upstream release the font was taken from: https://github.com/googlefonts/spacemono, fonts/ttf/. */
const FONT_SHA256 = 'cdcc95eddee312879a9728494e595f591cb159f3f276d79bc58673dec7e57138';

function manifests(): string[] {
  return readdirSync(join(ROOT, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(ROOT, 'packages', entry.name, 'package.json')))
    .map((entry) => join('packages', entry.name, 'package.json'));
}

describe('the font and the dependency of the font demos', () => {
  it('checks in Space Mono Bold Italic unmodified, with the SIL Open Font License 1.1 beside it', () => {
    const bytes = readFileSync(join(FONT_DIR, 'SpaceMono-BoldItalic.ttf'));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(FONT_SHA256);
    const licence = read('assets', 'fonts', 'space-mono', 'OFL.txt');
    expect(licence).toContain('Copyright 2016 The Space Mono Project Authors');
    expect(licence).toContain('SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007');
    expect(licence).toContain('PERMISSION & CONDITIONS');
    expect(read('assets', 'fonts', 'space-mono', 'README.md')).toContain(FONT_SHA256);
  });

  it('names the font and the library in a NOTICE file at the root', () => {
    const notice = read('NOTICE');
    expect(notice).toContain('Space Mono');
    expect(notice).toContain('SIL Open Font License, Version 1.1');
    expect(notice).toContain('assets/fonts/space-mono/OFL.txt');
    expect(notice).toContain('opentype.js');
    expect(notice).toContain('MIT');
  });

  it('is a development dependency of the repository, pinned exactly, and of no published package', () => {
    const root: unknown = JSON.parse(read('package.json'));
    const dev: unknown = typeof root === 'object' && root !== null ? Reflect.get(root, 'devDependencies') : undefined;
    expect(typeof dev === 'object' && dev !== null ? Reflect.get(dev, 'opentype.js') : undefined).toMatch(/^\d+\.\d+\.\d+$/u);
    expect(manifests().length).toBeGreaterThan(5);
    for (const file of manifests()) {
      const manifest: unknown = JSON.parse(read(file));
      for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        const table: unknown = typeof manifest === 'object' && manifest !== null ? Reflect.get(manifest, field) : undefined;
        const names = typeof table === 'object' && table !== null ? Object.keys(table) : [];
        expect(names.filter((name) => name === 'opentype.js' || name === '@types/opentype.js'), `${file} ${field}`).toEqual([]);
      }
    }
  });

  it('reads the font by a path from its own module, never by one relative to the working directory', () => {
    for (const file of ['examples/fun/main.ts', 'examples/fun/browser.ts']) {
      const text = read(...file.split('/'));
      expect(text, file).toContain('new URL(');
      expect(text, file).toContain('import.meta.url');
      expect(text, file).not.toMatch(/process\.cwd|readFileSync\(\s*'/u);
    }
    const demos = readdirSync(join(ROOT, 'examples', 'fun', 'demos')).filter((name) => name.endsWith('.ts'));
    for (const name of demos) expect(read('examples', 'fun', 'demos', name), name).not.toMatch(/\bfs\b|readFile|\.ttf/u);
  });
});
