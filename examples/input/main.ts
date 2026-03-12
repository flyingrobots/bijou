import { initDefaultContext } from '@flyingrobots/bijou-node';
import { input, badge, surfaceToString } from '@flyingrobots/bijou';

const ctx = initDefaultContext();
const badgeText = (label: string, variant: Parameters<typeof badge>[1]['variant']) =>
  surfaceToString(badge(label, { variant, ctx }), ctx.style);

async function main() {
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
  console.log(badgeText('CREATED', 'success'), ` ${name} — ${description || '(no description)'}`);
}

main().catch(console.error);
