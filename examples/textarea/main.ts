import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { type BijouContext, textarea, headerBox } from '@flyingrobots/bijou';

export async function main(ctx: BijouContext = initDefaultContext()): Promise<void> {
  const message = await textarea({
    title: 'Write a commit message:',
    placeholder: 'Describe your changes...',
    showLineNumbers: true,
    height: 8,
    ctx,
  });

  if (message != null) {
    console.log();
    console.log(headerBox('Commit Message', { detail: message, ctx }));
  } else {
    console.log('\nCancelled.');
  }
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(console.error);
}
