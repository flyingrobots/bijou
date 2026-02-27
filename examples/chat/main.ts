import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, separator, kbd } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg, type ResizeMsg,
  flex, viewport, createScrollState, scrollBy, scrollToBottom, vstack,
} from '@flyingrobots/bijou-tui';

initDefaultContext();

interface Message {
  sender: string;
  text: string;
  variant: 'info' | 'success' | 'primary';
}

interface Model {
  messages: Message[];
  input: string;
  cols: number;
  rows: number;
}

type Msg = { type: 'quit' };

const INITIAL_MESSAGES: Message[] = [
  { sender: 'alice', text: 'Hey, have you tried bijou?', variant: 'info' },
  { sender: 'bob', text: 'Not yet, what is it?', variant: 'success' },
  { sender: 'alice', text: 'A physics-powered TUI engine for TypeScript.', variant: 'info' },
  { sender: 'alice', text: 'Zero-dependency core, spring animations, flexbox layout.', variant: 'info' },
  { sender: 'bob', text: 'Sounds interesting. How do I install it?', variant: 'success' },
  { sender: 'alice', text: 'npm install @flyingrobots/bijou @flyingrobots/bijou-node', variant: 'info' },
  { sender: 'bob', text: 'Nice, trying it now!', variant: 'success' },
];

function renderMessages(messages: Message[], width: number): string {
  return messages.map(m => {
    const tag = badge(m.sender, { variant: m.variant });
    return `${tag} ${m.text}`;
  }).join('\n\n');
}

const app: App<Model, Msg> = {
  init: () => [{
    messages: [...INITIAL_MESSAGES],
    input: '',
    cols: process.stdout.columns ?? 80,
    rows: process.stdout.rows ?? 24,
  }, []],

  update: (msg, model) => {
    if ('type' in msg && msg.type === 'resize') {
      const r = msg as ResizeMsg;
      return [{ ...model, cols: r.columns, rows: r.rows }, []];
    }
    if ('type' in msg && msg.type === 'key') {
      const k = msg as KeyMsg;
      if (k.ctrl && k.key === 'c') return [model, [quit()]];
      if (k.key === 'q' && model.input === '') return [model, [quit()]];

      if (k.key === 'enter' && model.input.trim()) {
        const newMsg: Message = { sender: 'you', text: model.input.trim(), variant: 'primary' };
        return [{ ...model, messages: [...model.messages, newMsg], input: '' }, []];
      }

      if (k.key === 'backspace') {
        return [{ ...model, input: model.input.slice(0, -1) }, []];
      }

      // Printable character
      if (k.key.length === 1 && !k.ctrl && !k.alt) {
        return [{ ...model, input: model.input + k.key }, []];
      }
    }
    return [model, []];
  },

  view: (model) => {
    const content = renderMessages(model.messages, model.cols - 4);
    const vpHeight = model.rows - 4;
    const scroll = scrollToBottom(createScrollState(content, vpHeight));

    return flex(
      { direction: 'column', width: model.cols, height: model.rows },
      { basis: 1, content: separator({ label: 'chat', width: model.cols }) },
      { flex: 1, content: (w, h) =>
        viewport({ width: w, height: h, content, scrollY: scroll.y, showScrollbar: true })
      },
      { basis: 1, content: separator({ width: model.cols }) },
      { basis: 1, content: `  > ${model.input}\u2588  ${kbd('Enter')} send  ${kbd('q')} quit` },
    );
  },
};

run(app);
