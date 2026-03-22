import { initDefaultContext } from '@flyingrobots/bijou-node';
import { progressBar, separator, spinnerFrame, type Surface } from '@flyingrobots/bijou';
import { run, quit, tick, isKeyMsg, type App } from '@flyingrobots/bijou-tui';
import { badgeSurface, column, contentSurface, line, row, spacer } from '../_shared/example-surfaces.ts';

const ctx = initDefaultContext();

interface Download {
  name: string;
  size: string;
  progress: number;
  speed: number;      // percent per tick
  done: boolean;
}

interface Model {
  downloads: Download[];
  frame: number;
}

type Msg = { type: 'tick' } | { type: 'quit' };

const PACKAGES: Omit<Download, 'progress' | 'done'>[] = [
  { name: 'typescript', size: '42.1 MB', speed: 1.8 },
  { name: 'vitest', size: '12.3 MB', speed: 3.2 },
  { name: '@types/node', size: '3.8 MB', speed: 4.5 },
  { name: 'chalk', size: '41 KB', speed: 8.0 },
];

const app: App<Model, Msg> = {
  init: () => [
    {
      downloads: PACKAGES.map(p => ({ ...p, progress: 0, done: false })),
      frame: 0,
    },
    [tick(60, { type: 'tick' })],
  ],

  update: (msg, model) => {
    if (isKeyMsg(msg)) {
      if (msg.key === 'q' || (msg.ctrl && msg.key === 'c')) return [model, [quit()]];
    }

    if ('type' in msg && msg.type === 'quit') {
      return [model, [quit()]];
    }

    if ('type' in msg && msg.type === 'tick') {
      const downloads = model.downloads.map(d => {
        if (d.done) return d;
        const progress = Math.min(d.progress + d.speed + Math.random() * 1.5, 100);
        return { ...d, progress, done: progress >= 100 };
      });

      const allDone = downloads.every(d => d.done);
      const frame = model.frame + 1;

      if (allDone) {
        return [{ downloads, frame }, [tick(1500, { type: 'quit' })]];
      }

      return [{ downloads, frame }, [tick(60, { type: 'tick' })]];
    }

    return [model, []];
  },

  view: (model) => {
    const allDone = model.downloads.every(d => d.done);

    const rows = [spacer(), line('  Installing packages...'), spacer()] as Surface[];

    for (const d of model.downloads) {
      const name = d.name.padEnd(16);
      const size = d.size.padStart(8);

      if (d.done) {
        rows.push(row(['  ', badgeSurface('DONE', 'success', ctx), ` ${name} ${size}`]));
      } else {
        const spinner = spinnerFrame(model.frame, { label: '' });
        rows.push(line(`  ${spinner} ${name} ${size}`));
        rows.push(line(`    ${progressBar(Math.round(d.progress), { width: 40, showPercent: true })}`));
      }
    }

    rows.push(spacer());

    // Overall progress
    const totalProgress = model.downloads.reduce((sum, d) => sum + d.progress, 0) / model.downloads.length;
    rows.push(contentSurface(separator({ label: 'total', width: 58 })));
    rows.push(line(`  ${progressBar(Math.round(totalProgress), { width: 50, showPercent: true })}`));

    if (allDone) {
      rows.push(spacer());
      rows.push(row(['  ', badgeSurface('SUCCESS', 'success', ctx), ' All packages installed.']));
    }

    rows.push(spacer());
    return column(rows);
  },
};

run(app);
