import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, separator, surfaceToString } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg, type ResizeMsg,
  composite, toast, type ToastVariant, type ToastAnchor,
} from '@flyingrobots/bijou-tui';
import { ansiContentSurface } from '../_shared/surface-bridge.ts';

const ctx = initDefaultContext();
const badgeText = (label: string, variant: Parameters<typeof badge>[1]['variant'] = 'info') =>
  surfaceToString(badge(label, { variant, ctx }), ctx.style);

type Msg = 
  | KeyMsg 
  | ResizeMsg 
  | { type: 'show-toast', variant: ToastVariant };

interface Model {
  lastToast?: { variant: ToastVariant, timestamp: number };
  cols: number;
  rows: number;
  anchor: ToastAnchor;
}

const app: App<Model, Msg> = {
  init: () => [
    {
      cols: ctx.runtime.columns,
      rows: ctx.runtime.rows,
      anchor: 'bottom-right',
    },
    [],
  ],

  update: (msg, model) => {
    if (msg.type === 'resize') {
      return [{ ...model, cols: msg.columns, rows: msg.rows }, []];
    }
    if (msg.type === 'key') {
      if (msg.key === 'q') return [model, [quit()]];
      if (msg.key === 's') return [model, [{ type: 'show-toast', variant: 'success' }]];
      if (msg.key === 'e') return [model, [{ type: 'show-toast', variant: 'error' }]];
      if (msg.key === 'i') return [model, [{ type: 'show-toast', variant: 'info' }]];
      if (msg.key === 'a') {
        const anchors: ToastAnchor[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
        const idx = anchors.indexOf(model.anchor);
        const next = anchors[(idx + 1) % anchors.length]!;
        return [{ ...model, anchor: next }, []];
      }
    }
    if ('type' in msg && msg.type === 'show-toast') {
      return [{ ...model, lastToast: { variant: msg.variant, timestamp: Date.now() } }, []];
    }
    return [model, []];
  },

  view: (model) => {
    const { cols, rows } = model;

    const header = separator({ label: 'toast demo', width: cols, ctx });
    const help = [
      '  Keys:',
      `    ${badgeText('s')} success toast`,
      `    ${badgeText('e')} error toast`,
      `    ${badgeText('i')} info toast`,
      `    ${badgeText('a')} cycle anchor (${model.anchor})`,
      `    ${badgeText('q')} quit`,
    ].join('\n');

    const bgLines = [header, '', help];
    while (bgLines.length < rows) bgLines.push('');
    const bg = bgLines.join('\n');

    if (!model.lastToast || Date.now() - model.lastToast.timestamp > 3000) {
      return ansiContentSurface(bg);
    }

    const t = toast({
      message: `Operation ${model.lastToast.variant}!`,
      variant: model.lastToast.variant,
      anchor: model.anchor,
      screenWidth: cols,
      screenHeight: rows,
      ctx,
    });

    return ansiContentSurface(composite(bg, [t]));
  },
};

run(app);
