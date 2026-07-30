import type { TransitionShaderFn } from './transition-shaders.js';
import type { BuiltinTransition } from './transition-shaders.js';

/** Page transition styles: a built-in name or a custom shader function. */
export type PageTransition = BuiltinTransition | TransitionShaderFn;
