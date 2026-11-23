import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Every chrome component comes from the shadcn registry through the shadcn
// CLI, the README names each item, and the stylesheet declares nothing but
// shadcn's tokens with values from theme-book.
const example = new URL('../../examples/web-gpu/', import.meta.url);
const read = (path: string): string => readFileSync(new URL(path, example), 'utf8');
const exists = (path: string): boolean => existsSync(new URL(path, example));

const TOKENS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground',
  'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive',
  'border', 'input', 'ring', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'sidebar', 'sidebar-foreground',
  'sidebar-primary', 'sidebar-primary-foreground', 'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
];
// shadcn's `@theme inline` block maps each token to a Tailwind colour, the radius scale and the fonts.
const THEME_MAPPINGS = [...TOKENS.map((token) => `color-${token}`), 'radius-sm', 'radius-md', 'radius-lg', 'radius-xl', 'radius-2xl', 'radius-3xl', 'radius-4xl', 'font-sans', 'font-heading'];
const ALLOWED = new Set(['radius', ...TOKENS, ...THEME_MAPPINGS]);

function installed(directory: string): readonly string[] {
  if (!exists(directory)) return [];
  return readdirSync(new URL(directory, example)).filter((name) => name.endsWith('.tsx')).map((name) => name.replace(/\.tsx$/u, ''));
}

describe('examples/web-gpu chrome components and tokens', () => {
  it('installs from the @flyingrobots registry into src/vendor and src/components', () => {
    const config: unknown = JSON.parse(read('components.json'));
    expect(config).toMatchObject({
      tailwind: { css: 'src/index.css', cssVariables: true },
      aliases: { components: '@/vendor/components', ui: '@/vendor/components/ui', lib: '@/vendor/lib', hooks: '@/vendor/hooks' },
      registries: { '@flyingrobots': 'http://127.0.0.1:4173/r/{name}.json' },
    });
  });

  it('names every installed registry item in the README', () => {
    const readme = read('README.md');
    const items = [...installed('src/vendor/components/ui/'), ...installed('src/components/').map((name) => `@flyingrobots/${name}`)];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(readme, `README.md must list ${item}`).toContain(`\`${item}\``);
  });

  it('declares only shadcn tokens in its one stylesheet', () => {
    const css = read('src/index.css');
    const declared = [...css.matchAll(/(?<![\w-])--([a-z0-9-]+)\s*:/gu)].map((match) => match[1] ?? '');
    expect(declared.length).toBeGreaterThan(0);
    expect(declared.filter((name) => !ALLOWED.has(name))).toEqual([]);
    expect(exists('src/showcase.css')).toBe(false);
  });

  it('gives every light and dark token a value from theme-book, and records the command', () => {
    const css = read('src/index.css');
    expect(css).toMatch(/\/\* theme-book theme --seed "#[0-9a-f]{6}" --preset shadcn [^*]+\*\//u);
    for (const scope of [':root', '.dark']) {
      const block = new RegExp(`\\n${scope.replace('.', '\\.')} \\{([^}]*)\\}`, 'u').exec(css)?.[1] ?? '';
      const names = [...block.matchAll(/--([a-z0-9-]+):/gu)].map((match) => match[1]);
      expect(names.filter((name) => name !== 'radius').sort(), scope).toEqual([...TOKENS].sort());
    }
  });

  it('keeps the chrome styles out of the Bijou mounts with one boundary rule', () => {
    expect(read('src/index.css')).toMatch(/\[data-bijou-mount\] \* \{\s*all: revert;\s*\}/u);
  });
});
