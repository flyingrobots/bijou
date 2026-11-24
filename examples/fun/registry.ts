// Licensed under the Apache License, Version 2.0, like the rest of this repository.
import type { DemoEntry } from './contract.js';
import { metaballsDemo } from './demos/metaballs.js';
import { rainbowGradient } from './demos/rainbow.js';
import { wormholeDemo } from './demos/wormhole.js';
import { flipFluidDemo } from './demos/flip.js';
import { fluidDemo } from './demos/fluid.js';

/** The demos the shell lists, in order. Adding a demo is one line here. */
export const demos: readonly DemoEntry[] = [rainbowGradient, wormholeDemo, metaballsDemo, fluidDemo, flipFluidDemo];
