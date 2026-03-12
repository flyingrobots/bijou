import {
  alert,
  badge,
  headerBox,
  progressBar,
  separator,
  surfaceToString,
  table,
} from '@flyingrobots/bijou';
import { initDefaultContext } from '@flyingrobots/bijou-node';

const ctx = initDefaultContext();
const statusBadge = surfaceToString(badge('READY', { variant: 'success', ctx }), ctx.style);

const lines = [
  headerBox('Static Core Canary', { detail: 'downstream fixture', ctx }),
  separator({ label: 'Compatibility seam', ctx }),
  `Surface status: ${statusBadge}`,
  alert('One-shot report rendered cleanly.', { variant: 'success', ctx }),
  separator({ label: 'Progress', ctx }),
  progressBar(72, { width: 24, showPercent: true, ctx }),
  separator({ label: 'Packages', ctx }),
  table({
    columns: [
      { header: 'package' },
      { header: 'status' },
    ],
    rows: [
      ['@flyingrobots/bijou', 'ready'],
      ['@flyingrobots/bijou-node', 'ready'],
    ],
    ctx,
  }),
  'CANARY_STATIC_OK',
];

process.stdout.write(`${lines.join('\n')}\n`);
