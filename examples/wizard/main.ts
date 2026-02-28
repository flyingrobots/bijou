import { initDefaultContext } from '@flyingrobots/bijou-node';
import { wizard, input, select, confirm, separator, box } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

async function main() {
  console.log(separator({ label: 'Deployment Wizard', ctx }));
  console.log();

  const result = await wizard<{
    target: string;
    provider: string;
    hostname: string;
    monitoring: boolean;
  }>({
    steps: [
      {
        key: 'target',
        field: () => select({
          title: 'Deployment target:',
          options: [
            { label: 'Cloud', value: 'cloud', description: 'AWS, GCP, Azure, etc.' },
            { label: 'Self-hosted', value: 'self-hosted', description: 'Your own server' },
            { label: 'Local', value: 'local', description: 'Run on this machine' },
          ],
          ctx,
        }),
      },
      {
        key: 'provider',
        field: () => input({
          title: 'Cloud provider:',
          placeholder: 'aws',
          required: true,
          ctx,
        }),
        skip: (vals) => vals.target !== 'cloud',
      },
      {
        key: 'hostname',
        field: () => input({
          title: 'Server hostname:',
          placeholder: 'deploy.example.com',
          required: true,
          ctx,
        }),
        skip: (vals) => vals.target !== 'self-hosted',
      },
      {
        key: 'monitoring',
        field: () => confirm({
          title: 'Enable monitoring?',
          defaultValue: true,
          ctx,
        }),
      },
    ],
  });

  console.log();
  console.log(separator({ label: 'Summary', ctx }));
  console.log();

  if (result.cancelled) {
    console.log('Wizard cancelled.');
    return;
  }

  const { target, provider, hostname, monitoring } = result.values;
  const lines = [
    `Target:      ${target}`,
    ...(provider ? [`Provider:    ${provider}`] : []),
    ...(hostname ? [`Hostname:    ${hostname}`] : []),
    `Monitoring:  ${monitoring ? 'yes' : 'no'}`,
  ];

  console.log(box(lines.join('\n'), { ctx }));
}

main().catch(console.error);
