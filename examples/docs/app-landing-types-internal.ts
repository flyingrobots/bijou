import type { Surface } from '../../packages/bijou/src/index.js';
export type {
  LandingModel,
  LandingPerfHudModel,
  LandingPerfHudOptions,
  LandingRendererOptions,
} from './app-landing-types.js';

export interface LandingFrameCache {
  key?: string;
  front?: Surface;
  back?: Surface;
}
