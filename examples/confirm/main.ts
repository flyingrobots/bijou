import { initDefaultContext } from '@flyingrobots/bijou-node';
import { confirm } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

async function main() {
  const deploy = await confirm({ title: 'Deploy to production?', defaultValue: false, ctx });
  console.log();

  if (deploy) {
    console.log('Confirmed: deploying now...');
  } else {
    console.log('Cancelled: deploy skipped.');
  }
}

main().catch(console.error);
