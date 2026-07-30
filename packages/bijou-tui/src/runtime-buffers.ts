import {
  createSurface,
  type Surface,
} from '@flyingrobots/bijou';

const BYTES_PER_CELL = 96;
const OUTPUT_SLACK = 8192;

/** Own the two framebuffers and pooled differ output bytes. */
export class RuntimeFramebuffers {
  current: Surface;
  next: Surface;
  output: Uint8Array;

  constructor(columns: number, rows: number) {
    this.current = createSurface(columns, rows);
    this.next = createSurface(columns, rows);
    this.output = allocateOutput(columns, rows);
  }

  reset(columns: number, rows: number, invalidateFront = false): void {
    this.current = invalidateFront
      ? invalidatedSurface(columns, rows)
      : createSurface(columns, rows);
    this.next = createSurface(columns, rows);
    if (this.output.byteLength < outputCapacity(columns, rows)) {
      this.output = allocateOutput(columns, rows);
    }
  }

  ensure(columns: number, rows: number): void {
    if (
      this.current.width !== columns
      || this.current.height !== rows
      || this.next.width !== columns
      || this.next.height !== rows
    ) {
      this.reset(columns, rows);
    }
  }

  adoptTarget(surface: Surface): void {
    const previousFront = this.current;
    const previousBack = this.next;
    this.current = surface;
    this.next = surface === previousFront
      ? previousBack
      : previousFront;
  }

  replaceFront(surface: Surface): void {
    this.current = surface;
    this.next = createSurface(surface.width, surface.height);
  }
}

function allocateOutput(columns: number, rows: number): Uint8Array {
  return new Uint8Array(outputCapacity(columns, rows));
}

function outputCapacity(columns: number, rows: number): number {
  return columns * rows * BYTES_PER_CELL + OUTPUT_SLACK;
}

function invalidatedSurface(columns: number, rows: number): Surface {
  const surface = createSurface(columns, rows);
  surface.fill({ char: '\0', empty: false });
  return surface;
}
