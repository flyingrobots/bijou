import type { Cmd } from './types.js';
import type {
  FrameAction,
  FramedAppMsg,
  InternalFrameModel,
} from './app-frame-types.js';

type TransitionAction = Extract<
  FrameAction,
  { readonly type: 'transition' | 'transition-complete' }
>;
type FrameUpdate<PageModel, Msg> = [
  InternalFrameModel<PageModel, Msg>,
  Cmd<FramedAppMsg<Msg>>[],
];

const complete = <PageModel, Msg>(
  model: InternalFrameModel<PageModel, Msg>,
): FrameUpdate<PageModel, Msg> => [
  {
    ...model,
    transitionProgress: 1,
    transitionFrame: 0,
    previousPageId: undefined,
    activeTransition: undefined,
    transitionStartMs: undefined,
    transitionTimeline: undefined,
    transitionTimelineState: undefined,
  },
  [],
];

export function updateFrameTransition<PageModel, Msg>(
  action: TransitionAction,
  model: InternalFrameModel<PageModel, Msg>,
): FrameUpdate<PageModel, Msg> {
  if (action.generation !== model.transitionGeneration) {
    return [model, []];
  }
  if (action.type === 'transition-complete') return complete(model);
  if (model.transitionTimeline && model.transitionTimelineState) {
    const state = model.transitionTimeline.step(
      model.transitionTimelineState,
      Math.max(0, action.dt),
    );
    const values = model.transitionTimeline.values(state);
    const progress = Math.min(
      1,
      Math.max(0, values['progress'] ?? action.progress),
    );
    if (model.transitionTimeline.done(state) || progress >= 1) {
      return complete(model);
    }
    return [
      {
        ...model,
        transitionProgress: progress,
        transitionFrame: model.transitionFrame + 1,
        transitionTimelineState: state,
      },
      [],
    ];
  }
  return [
    {
      ...model,
      transitionProgress: action.progress,
      transitionFrame: model.transitionFrame + 1,
    },
    [],
  ];
}
