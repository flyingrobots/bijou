import type { App, Cmd, MouseMsg, PulseMsg, RunOptions } from './types.js';
import type { FrameAction } from './app-frame-action-types.js';
import type { FrameModel } from './app-frame-model-types.js';

export const PAGE_MSG_TOKEN = Symbol('app-frame-page-msg');
export const FRAME_MSG_TOKEN = Symbol('app-frame-frame-msg');

export type FramePageMsg<Msg> = Msg | MouseMsg | PulseMsg;

export type FramePageUpdateResult<PageModel, Msg> = [
  PageModel,
  Cmd<Msg | FrameScopedMsg>[],
];

export type FramePageText<PageModel> = string | ((model: PageModel) => string);

export interface PageScopedMsg<Msg> {
  readonly [PAGE_MSG_TOKEN]: true;
  readonly pageId: string;
  readonly msg: FramePageMsg<Msg>;
}

export interface FrameScopedMsg {
  readonly [FRAME_MSG_TOKEN]: true;
  readonly action: FrameAction;
}

export type FramedAppMsg<Msg> = Msg | PageScopedMsg<Msg> | FrameScopedMsg;

export type FramedAppUpdateResult<PageModel, Msg> = [
  FrameModel<PageModel>,
  Cmd<FramedAppMsg<Msg>>[],
];

export interface FramedAppRunOptions<Msg> extends RunOptions<
  FramedAppMsg<Msg>
> {
  readonly frameBudgetMs?: number;
}

export interface FramedApp<PageModel, Msg> extends App<
  FrameModel<PageModel>,
  FramedAppMsg<Msg>
> {
  run(options?: FramedAppRunOptions<Msg>): Promise<void>;
}
