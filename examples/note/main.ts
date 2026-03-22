import { ctx } from '../_shared/setup.ts';
import { note } from '@flyingrobots/bijou';

async function main() {
  await note({
    title: 'Heads up',
    message: 'This wizard will create files in the current workspace. Review the options before continuing.',
    ctx,
  });

  console.log();

  await note({
    message: 'You can press Ctrl+C at any prompt to cancel safely.',
    ctx,
  });
}

main().catch(console.error);
