import { initDefaultContext } from '@flyingrobots/bijou-node';
import { select, badge, surfaceToString } from '@flyingrobots/bijou';

const ctx = initDefaultContext();
const badgeText = (label: string, variant: Parameters<typeof badge>[1]['variant']) =>
  surfaceToString(badge(label, { variant, ctx }), ctx.style);

async function main() {
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
  console.log('Selected:', badgeText(manager.toUpperCase(), 'primary'));
}

main().catch(console.error);
