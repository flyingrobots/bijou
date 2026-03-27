import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { type BijouContext, select } from '@flyingrobots/bijou';

export async function main(ctx: BijouContext = initDefaultContext()): Promise<void> {
  const manager = await select({
    title: 'Choose a package manager:',
    options: [
      { label: 'npm', value: 'npm', description: 'Node Package Manager' },
      { label: 'yarn', value: 'yarn', description: 'Fast, reliable, and secure' },
      { label: 'pnpm', value: 'pnpm', description: 'Fast, disk space efficient' },
      { label: 'bun', value: 'bun', description: 'All-in-one JavaScript runtime' },
      { label: 'deno', value: 'deno', description: 'Secure runtime for JS and TS' },
      { label: 'none', value: 'none', description: 'I\'ll manage dependencies myself' },
    ],
    ctx,
  });

  console.log();
  console.log(`Selected package manager: ${manager.toUpperCase()}`);
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(console.error);
}
