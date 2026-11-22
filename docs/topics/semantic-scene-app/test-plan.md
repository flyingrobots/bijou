# Test plan: semantic scene app contract

This ledger lists each requirement of the
[semantic scene app contract](./README.md), the test that holds it, and its
status. Every test is in `packages/bijou-tui/src/`, in the file named in the
requirement's group heading. The oracle for each case is the assertion in the
named test. The fixture app is `createPanelApp()` in
`semantic-scene.test-support.ts`: a button action, a text input action, and a
toggle action.

## Golden: `semantic-scene.part01.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| SSA-01 | The first frame holds the initial model and a scene that validates. | `projects a validated scene from the initial model` | Implemented |
| SSA-02 | A recorded trace of button, text input, and toggle actions gives the expected model after each step. | `replays button, text input and toggle actions into model transitions` | Implemented |
| SSA-03 | Commands from `init()` and `update()` run through the bus, and their messages reach `update()`. | `executes the commands that init and update return through the event bus` | Implemented |
| SSA-04 | Each transition gives listeners a new frame with the scene for the new model. | `projects an updated scene after each transition` | Implemented |
| SSA-05 | `dispatchAction()` receives the declared command and target, and the input value. | `gives dispatchAction the declared command, target and input value` | Implemented |

## Edges: `semantic-scene.part02.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| SSA-06 | An action that the prior transition removed is ignored with a typed diagnostic, and the frame is unchanged. | `ignores an action that the prior transition removed` | Implemented |
| SSA-07 | An action that no scene declared is ignored. | `ignores an action that no scene declared` | Implemented |
| SSA-08 | A declared action without a message is reported as `action-unhandled`. | `reports a declared action that the app does not map to a message` | Implemented |
| SSA-09 | An invalid first scene throws with the `validateUiSceneIr()` issues. | `fails loudly when the initial scene is invalid` | Implemented |
| SSA-10 | An invalid scene after a transition crashes the controller and keeps the last valid frame. | `crashes without changing the frame when a transition projects an invalid scene` | Implemented |
| SSA-11 | A scene with no actions runs, and every request is ignored. | `runs a scene with an empty action list` | Implemented |
| SSA-12 | A request after `stop()` is ignored, and a second `stop()` is safe. | `ignores an invocation after stop, and stops twice safely` | Implemented |

## Failure modes: `semantic-scene.part03.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| SSA-13 | A dispatched message goes through bus middleware, which can drop it. | `sends every dispatched message through the event bus` | Implemented |
| SSA-14 | A failure in `update()` becomes a crash, not a throw, and keeps the frame. | `contains an update failure as a crash and keeps the frame` | Implemented |
| SSA-15 | A failure in `dispatchAction()` becomes a crash. | `contains a dispatchAction failure as a crash` | Implemented |

## Replay and quit: `semantic-scene.part05.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| SSA-16 | One trace gives equal checkpoints with two contexts and two bus owners. | `gives identical checkpoints for one trace on two hosts` | Implemented |
| SSA-17 | 200 requests that alternate between a declared and a stale action id give the same checkpoints on each run. | `replays 200 alternating valid and stale invocations deterministically` | Implemented |
| SSA-23 | A command that returns `QUIT` stops the controller. | `stops when a command returns QUIT` | Implemented |

## Browser seam attributes and package surface: `semantic-scene.part04.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| SSA-18 | The attribute constants name the attributes that `lowerUiSceneToBrowser()` emits for the fixture scene. | `names the node and action attributes that the browser seam emits` | Implemented |
| SSA-19 | Each action id read back from the lowered tree dispatches. | `dispatches every action id read back from the lowered tree` | Implemented |
| SSA-20 | A `data-bijou-action` value splits into action ids. | `splits a data-bijou-action value into action ids` | Implemented |
| SSA-21 | The package root exports the contract. | `exports the contract from the package root` | Implemented |
| SSA-22 | The controller runs with no `document` and no `window`. | `runs where no document or window exists` | Implemented |

## Not covered

- No test runs the controller under a DOM host. SSA-16 uses two
  `BijouContext` values and two bus owners in the sealed Node runner.
- No test connects the controller to `run()`. The contract is not part of the
  terminal runtime.
- SSA-22 checks the globals of the test process. It does not inspect the
  import graph of the package.
