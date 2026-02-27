import { initDefaultContext } from '@flyingrobots/bijou-node';
import { textarea, headerBox } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

async function main() {
  const message = await textarea({
    title: 'Write a commit message:',
    placeholder: 'Describe your changes...',
    showLineNumbers: true,
    height: 8,
    ctx,
  });

  if (message) {
    console.log();
    console.log(headerBox('Commit Message', { detail: message, ctx }));
  } else {
    console.log('\nCancelled.');
  }
}

main().catch(console.error);
