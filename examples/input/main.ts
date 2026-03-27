import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { type BijouContext, input } from '@flyingrobots/bijou';

export async function main(ctx: BijouContext = initDefaultContext()): Promise<void> {
  const name = await input({
    title: 'Project name:',
    placeholder: 'my-project',
    required: true,
    validate: (value) => {
      if (/[A-Z]/.test(value)) return { valid: false, message: 'Must be lowercase' };
      if (/\s/.test(value)) return { valid: false, message: 'No spaces allowed' };
      return { valid: true };
    },
    ctx,
  });

  console.log();

  const description = await input({
    title: 'Description:',
    placeholder: 'A short description of your project',
    ctx,
  });

  console.log();
  console.log(`Created project: ${name} — ${description || '(no description)'}`);
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(console.error);
}
