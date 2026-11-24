import { mkdirSync, writeFileSync } from 'node:fs';
import { COMPONENTS_DATA_DIR, componentsBrowserData, staleComponentsBrowserData } from './components-browser-data.js';
import { DOGFOOD_DATA_DIR, dogfoodBrowserData, staleDogfoodBrowserData } from './dogfood-browser-data.js';

// Write the Components library's and DOGFOOD's generated data, or with --check fail when a
// committed copy differs from what its sources give now.
const ROOT = new URL('../', import.meta.url);

if (process.argv.includes('--check')) {
  const stale = [...staleComponentsBrowserData(ROOT), ...staleDogfoodBrowserData(ROOT)];
  if (stale.length > 0) {
    process.stderr.write(`components-browser-data: stale ${stale.join(', ')}; run npm run components:data\n`);
    process.exit(1);
  }
  process.stdout.write('components-browser-data: up to date\n');
} else {
  const files = new Map([...componentsBrowserData(), ...dogfoodBrowserData()]);
  for (const dir of [COMPONENTS_DATA_DIR, DOGFOOD_DATA_DIR]) mkdirSync(new URL(`${dir}/`, ROOT), { recursive: true });
  for (const [path, text] of files) writeFileSync(new URL(path, ROOT), text, 'utf8');
  process.stdout.write(`components-browser-data: wrote ${String(files.size)} files\n`);
}
