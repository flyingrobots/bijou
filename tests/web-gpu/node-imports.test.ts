import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';
import { REFUSED_APPS } from '../../examples/web-gpu/src/refused-apps.js';
import { SHOWCASE_APPS } from '../../examples/web-gpu/src/apps.js';

// The showcase build refuses every Node built-in instead of stubbing it. These
// cases build modules with the showcase's own Vite configuration, offline.
const root = new URL('../../', import.meta.url);
const configFile = fileURLToPath(new URL('examples/web-gpu/vite.config.ts', root));

async function bundle(module: string): Promise<unknown> {
  try {
    await build({
      configFile,
      logLevel: 'silent',
      build: { write: false, rollupOptions: { input: fileURLToPath(new URL(module, root)) } },
    });
    return null;
  } catch (error: unknown) {
    return error;
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

describe('examples/web-gpu bundle has no Node.js built-in', () => {
  it('builds the showcase page with no refusal', async () => {
    expect(message(await bundle('examples/web-gpu/index.html'))).toBe('null');
  });

  it.each([
    ['counter', 'examples/counter/main.ts'],
    ['components', 'examples/components/library.ts'],
    ['hero', 'examples/hero/app.ts'],
    ['hero', 'examples/hero/perf-browser.ts'],
    ['showcase', 'examples/showcase/app.ts'],
  ])('builds the %s app module %s with no refusal', async (_id, module) => {
    expect(message(await bundle(module))).toBe('null');
  });

  it('lists every example app it mounts and refuses none', () => {
    expect(SHOWCASE_APPS.map((app) => app.id)).toEqual(['counter', 'components', 'hero', 'showcase', 'dogfood', 'soak', 'fun', 'dual']);
    expect(REFUSED_APPS).toEqual([]);
  });

  it('refuses a direct import of a Node built-in and names the importer', async () => {
    // The config imports node:module, node:path and node:url; whichever resolves first is named.
    expect(message(await bundle('examples/web-gpu/vite.config.ts'))).toMatch(
      /BIJOU_WEB_GPU_NODE_IMPORT: node:(module|path|url) imported by examples\/web-gpu\/vite\.config\.ts/u,
    );
  });
});
