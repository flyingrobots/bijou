import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { type BijouContext, group, input, select, multiselect, confirm, separator, box } from '@flyingrobots/bijou';

type ExampleWriter = (line?: string) => void;

function consoleWriter(line = ''): void {
  console.log(line);
}

export async function main(
  ctx: BijouContext = initDefaultContext(),
  writeLine: ExampleWriter = consoleWriter,
): Promise<void> {
  writeLine(separator({ label: 'Project Setup', ctx }));
  writeLine();

  const result = await group({
    name: () => input({
      title: 'Project name:',
      placeholder: 'my-app',
      required: true,
      ctx,
    }),
    framework: () => select({
      title: 'Framework:',
      options: [
        { label: 'Express', value: 'express' },
        { label: 'Fastify', value: 'fastify' },
        { label: 'Hono', value: 'hono' },
        { label: 'None', value: 'none' },
      ],
      ctx,
    }),
    features: () => multiselect({
      title: 'Features:',
      options: [
        { label: 'TypeScript', value: 'typescript' },
        { label: 'ESLint', value: 'eslint' },
        { label: 'Docker', value: 'docker' },
      ],
      ctx,
    }),
    deploy: () => confirm({
      title: 'Set up deployment?',
      defaultValue: true,
      ctx,
    }),
  });

  writeLine();
  writeLine(separator({ label: 'Summary', ctx }));
  writeLine();

  if (result.cancelled) {
    writeLine('Setup cancelled.');
    return;
  }

  const summary = [
    `Name:       ${result.values.name}`,
    `Framework:  ${result.values.framework}`,
    `Features:   ${result.values.features.join(', ') || 'none'}`,
    `Deploy:     ${result.values.deploy ? 'yes' : 'no'}`,
  ].join('\n');

  writeLine(box(summary, { ctx }));
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(console.error);
}
