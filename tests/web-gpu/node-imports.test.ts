import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';
import { REFUSED_APPS } from '../../examples/web-gpu/src/refused-apps.js';

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

  it('builds each mounted app, through its unmodified entry, with no refusal', async () => {
    expect(message(await bundle('examples/counter/main.ts'))).toBe('null');
    expect(message(await bundle('examples/showcase/app.ts'))).toBe('null');
  });

  it.each(REFUSED_APPS.map((app) => [app.id, app] as const))('refuses %s with the reason the HUD shows', async (_id, app) => {
    expect(message(await bundle(app.module))).toContain(`${app.code}: ${app.reason}`);
  });

  it('refuses a direct import of a Node built-in and names the importer', async () => {
    expect(message(await bundle('examples/web-gpu/vite.config.ts'))).toContain(
      'BIJOU_WEB_GPU_NODE_IMPORT: node:module imported by examples/web-gpu/vite.config.ts',
    );
  });
});
