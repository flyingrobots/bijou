import { initDefaultContext } from '@flyingrobots/bijou-node';
import { separator, badge } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg, type ResizeMsg,
  composite, tooltip, type TooltipDirection,
} from '@flyingrobots/bijou-tui';

const ctx = initDefaultContext();

type Msg = KeyMsg | ResizeMsg;

const directions: TooltipDirection[] = ['top', 'bottom', 'left', 'right'];

interface Model {
  selectedRow: number;
  selectedCol: number;
  dirIndex: number;
  cols: number;
  rows: number;
}

const app: App<Model, Msg> = {
  init: () => {
    const cols = ctx.runtime.columns();
    const rows = ctx.runtime.rows();
    return [{ selectedRow: 10, selectedCol: 20, dirIndex: 0, cols, rows }, []];
  },

  update: (msg, model) => {
    if (msg.type === 'resize') {
      return [{ ...model, cols: msg.cols, rows: msg.rows }, []];
    }
    if (msg.type === 'key') {
      switch (msg.key) {
        case 'q': return [model, [quit()]];
        case 'd': return [{ ...model, dirIndex: (model.dirIndex + 1) % directions.length }, []];
        case 'up': return [{ ...model, selectedRow: Math.max(2, model.selectedRow - 1) }, []];
        case 'down': return [{ ...model, selectedRow: Math.min(model.rows - 3, model.selectedRow + 1) }, []];
        case 'left': return [{ ...model, selectedCol: Math.max(2, model.selectedCol - 1) }, []];
        case 'right': return [{ ...model, selectedCol: Math.min(model.cols - 3, model.selectedCol + 1) }, []];
      }
    }
    return [model, []];
  },

  view: (model) => {
    const { cols, rows, selectedRow, selectedCol, dirIndex } = model;
    const dir = directions[dirIndex]!;

    const header = separator({ label: 'tooltip demo', width: cols, ctx });
    const help = `  Arrows: move target · ${badge('d', { ctx })}: cycle direction (${dir}) · ${badge('q', { ctx })}: quit`;
    const bgLines = [header, '', help];
    while (bgLines.length < rows) bgLines.push('');

    // Place a marker at the target position
    let markerLine = bgLines[selectedRow]!;
    if (markerLine.length < selectedCol + 1) {
      markerLine = markerLine.padEnd(selectedCol + 1, ' ');
    }
    bgLines[selectedRow] = markerLine.substring(0, selectedCol) + '◆' + markerLine.substring(selectedCol + 1);
    const bg = bgLines.join('\n');

    const tip = tooltip({
      content: `Direction: ${dir}\nRow: ${selectedRow} Col: ${selectedCol}`,
      row: selectedRow,
      col: selectedCol,
      direction: dir,
      screenWidth: cols,
      screenHeight: rows,
      borderToken: ctx.theme.theme.border.primary,
      ctx,
    });

    return composite(bg, [tip]);
  },
};

run(app);
