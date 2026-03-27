import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { type BijouContext, confirm } from '@flyingrobots/bijou';

export async function main(ctx: BijouContext = initDefaultContext()): Promise<void> {
  const deploy = await confirm({ title: 'Deploy to production?', defaultValue: false, ctx });
  console.log();

  if (deploy) {
    console.log('Confirmed: deploying now...');
  } else {
    console.log('Cancelled: deploy skipped.');
  }
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(console.error);
}
