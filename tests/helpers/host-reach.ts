import { builtinModules } from 'node:module';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, parseSync, type Plugin } from 'vite';
import showcaseConfig from '../../examples/web-gpu/vite.config.js';
import { hostGlobalsIn } from './host-reach-ast.js';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const NODE_BUILTINS = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));
const SCRIPT = /\.(?:[cm]?[jt]sx?|json)$/u;

const repoPath = (id: string): string => relative(repository, id).split('\\').join('/');

/**
 * Records every Node built-in a module imports and every Node host global it
 * names, instead of stopping at the first. Each built-in becomes an external
 * so the graph walk carries on past it.
 */
function hostReach(findings: Set<string>): Plugin {
  return {
    name: 'bijou-tests:host-reach',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!NODE_BUILTINS.has(id) && !id.startsWith('node:')) return null;
      findings.add(`${id.startsWith('node:') ? id : `node:${id}`} imported by ${importer === undefined ? '(entry)' : repoPath(importer)}`);
      return { id, external: true };
    },
  };
}

function hostGlobals(findings: Set<string>): Plugin {
  return {
    name: 'bijou-tests:host-globals',
    enforce: 'post',
    transform(code, id) {
      const file = id.split('?')[0] ?? id;
      if (id.startsWith('\0') || !SCRIPT.test(file)) return null;
      for (const name of hostGlobalsIn(parseSync(file, code, { lang: 'js' }).program)) findings.add(`${name} used by ${repoPath(file)}`);
      return null;
    },
  };
}

/**
 * Bundle `module` (from the repository root) with the showcase's resolution
 * and list each Node built-in import and Node host global its graph reaches,
 * through every static import, dynamic import and re-export, sorted.
 */
export async function hostReachOf(module: string): Promise<string[]> {
  const findings = new Set<string>();
  await build({
    ...showcaseConfig,
    configFile: false,
    logLevel: 'silent',
    plugins: [hostReach(findings), hostGlobals(findings)],
    build: {
      ...showcaseConfig.build,
      write: false,
      rollupOptions: { input: fileURLToPath(new URL(module, new URL('../../', import.meta.url))) },
    },
  });
  return [...findings].sort();
}
