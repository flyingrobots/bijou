# `filePicker()`

Directory browser with keyboard navigation

![demo](demo.gif)

## Run

```sh
npx tsx examples/file-picker/main.ts
```

## Code

```typescript
import { initDefaultContext, nodeIO } from '@flyingrobots/bijou-node';
import { separator } from '@flyingrobots/bijou';
import {
  run, quit, isKeyMsg, isResizeMsg, type App,
  createFilePickerState, filePicker,
  fpFocusNext, fpFocusPrev, fpEnter, fpBack,
  filePickerKeyMap, helpShort, vstack,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

const io = nodeIO();

type Msg =
  | { type: 'focus-next' }
  | { type: 'focus-prev' }
  | { type: 'enter' }
  | { type: 'back' }
  | { type: 'quit' };

const keys = filePickerKeyMap<Msg>({
  focusNext: { type: 'focus-next' },
  focusPrev: { type: 'focus-prev' },
  enter: { type: 'enter' },
  back: { type: 'back' },
  quit: { type: 'quit' },
});

interface Model {
  fp: ReturnType<typeof createFilePickerState>;
  cols: number;
}

const app: App<Model, Msg> = {
  init: () => [{
    fp: createFilePickerState({ cwd: process.cwd(), io, height: 15 }),
    cols: process.stdout.columns ?? 80,
  }, []],

  update: (msg, model) => {
    if (isResizeMsg(msg)) {
      return [{ ...model, cols: msg.columns }, []];
    }

    if (isKeyMsg(msg)) {
      const action = keys.handle(msg);
      if (!action) return [model, []];

      switch (action.type) {
        case 'quit': return [model, [quit()]];
        case 'focus-next': return [{ ...model, fp: fpFocusNext(model.fp) }, []];
        case 'focus-prev': return [{ ...model, fp: fpFocusPrev(model.fp) }, []];
        case 'enter': {
          const entry = model.fp.entries[model.fp.focusIndex];
          if (entry && !entry.isDirectory) return [model, [quit()]];
          return [{ ...model, fp: fpEnter(model.fp, io) }, []];
        }
        case 'back': return [{ ...model, fp: fpBack(model.fp, io) }, []];
      }
    }

    return [model, []];
  },

  view: (model) => {
    const header = separator({ label: 'file picker', width: model.cols });
    const body = filePicker(model.fp);
    const help = `  ${helpShort(keys)}`;
    return vstack(header, body, help);
  },
};

run(app);
```

[← Examples](../README.md)
