export interface RuntimeStateLike {
  readonly id: string;
}

export interface RuntimeStateMachine<State extends RuntimeStateLike> {
  readonly current: State;
  readonly previous?: State;
  readonly transitionCount: number;
}

export function createRuntimeStateMachine<State extends RuntimeStateLike>(
  initialState: State,
): RuntimeStateMachine<State> {
  return {
    current: initialState,
    previous: undefined,
    transitionCount: 0,
  };
}

export function transitionRuntimeState<State extends RuntimeStateLike>(
  machine: RuntimeStateMachine<State>,
  nextState: State,
): RuntimeStateMachine<State> {
  return {
    current: nextState,
    previous: machine.current,
    transitionCount: machine.transitionCount + 1,
  };
}
