import { initDefaultContext } from '@flyingrobots/bijou-node';
import { confirm, badge, surfaceToString } from '@flyingrobots/bijou';

const ctx = initDefaultContext();
const badgeText = (label: string, variant: Parameters<typeof badge>[1]['variant']) =>
  surfaceToString(badge(label, { variant, ctx }), ctx.style);

async function main() {
  const deploy = await confirm({ title: 'Deploy to production?', defaultValue: false, ctx });
  console.log();

  if (deploy) {
    console.log(badgeText('YES', 'success'), ' Deploying now...');
  } else {
    console.log(badgeText('NO', 'muted'), ' Deploy cancelled.');
  }
}

main().catch(console.error);
