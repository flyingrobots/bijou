import { initDefaultContext } from '@flyingrobots/bijou-node';
import { markdown, box } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

const SOURCE = `
# Bijou Markdown

**Bijou** supports a subset of CommonMark that degrades gracefully across terminal modes.

## Features

- **Inline formatting**: **bold**, *italic*, and `code spans`
- **Lists**: bulleted and numbered
- **Links**: [GitHub](https://github.com/flyingrobots/bijou)
- **Blocks**:
  > Blockquotes for highlights
  ```ts
  console.log("Fenced code blocks");
  ```

---

### Why use it?

It allows you to ship documentation or help text that looks great in a TTY but remains readable when piped to a file or a screen reader.
`;

console.log(box(markdown(SOURCE, { ctx }), { padding: { top: 1, bottom: 1, left: 2, right: 2 } }));
