import { builtinModules } from 'node:module';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// The showcase bundles the Bijou packages from source so that every module,
// and every module-level singleton such as the default context, has one copy.
const source = (path: string): string => fileURLToPath(new URL(`../../packages/${path}`, import.meta.url));
const repository = fileURLToPath(new URL('../../', import.meta.url));
const NODE_BUILTINS = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));

/**
 * Refuse every Node.js built-in. Vite's default replaces one with an empty
 * browser stub and only warns; the showcase claims zero Node polyfills, so an
 * import of one fails the build and names the importer.
 */
export function refuseNodeBuiltins(): Plugin {
  return {
    name: 'bijou-web-gpu:refuse-node-builtins',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!NODE_BUILTINS.has(id) && !id.startsWith('node:')) return null;
      const from = importer === undefined ? '(entry)' : relative(repository, importer).split('\\').join('/');
      this.error(`BIJOU_WEB_GPU_NODE_IMPORT: ${id} imported by ${from}`);
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  // React and Tailwind build the page chrome; neither adds a Node built-in to the bundle.
  plugins: [refuseNodeBuiltins(), react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@flyingrobots\/bijou\/perf$/u, replacement: source('bijou/src/core/render/packed-cell.ts') },
      { find: /^@flyingrobots\/bijou\/viz$/u, replacement: source('bijou/src/core/viz/index.ts') },
      { find: /^@flyingrobots\/bijou$/u, replacement: source('bijou/src/index.ts') },
      { find: /^@flyingrobots\/bijou-i18n$/u, replacement: source('bijou-i18n/src/index.ts') },
      { find: /^@flyingrobots\/bijou-tui$/u, replacement: source('bijou-tui/src/index.ts') },
      { find: /^@flyingrobots\/bijou-web$/u, replacement: source('bijou-web/src/index.ts') },
      // Only startApp() exists in the browser; see src/browser-start-app.ts.
      { find: /^@flyingrobots\/bijou-node$/u, replacement: fileURLToPath(new URL('src/browser-start-app.ts', import.meta.url)) },
      // The shadcn components' own imports, as components.json names them.
      { find: /^@\//u, replacement: fileURLToPath(new URL('src/', import.meta.url)) },
    ],
  },
  build: {
    outDir: 'dist',
    // The showcase, and the page the browser suite checks mountBijouDom() on.
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        dom: fileURLToPath(new URL('dom.html', import.meta.url)),
      },
    },
    emptyOutDir: true,
    target: 'es2022',
    reportCompressedSize: false,
  },
  server: { host: '127.0.0.1', strictPort: true },
  preview: { host: '127.0.0.1', strictPort: true },
});
