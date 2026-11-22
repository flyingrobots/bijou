# Semantic scene app contract

This page is the reference for the semantic scene app contract in
`@flyingrobots/bijou-tui`. A semantic scene app is a TEA app that also
projects its model to a `ui-scene-ir/1` scene and maps an action of that scene
to a message. The controller runs such an app without a terminal and without a
DOM.

The cases that hold this behavior are listed in the
[test plan](./test-plan.md).

## What the contract is for

`App.view()` returns a `Surface` or a layout tree. A host that shows semantic
UI, such as a DOM host, cannot recover roles and actions from terminal cells.
It needs the scene, and a typed way to send an action back to
`App.update()`.

The contract gives the host both. It does not render. The
[browser renderer seam](../ui-scene-browser/README.md) lowers a scene to
elements, and a host connects the two.

## Types

| Type | Meaning |
| --- | --- |
| `SceneProjection<Model, M>` | `viewScene(model, ctx)` returns a `UiSceneIr`. `dispatchAction(action, model)` returns a message `M`, or `undefined` when no message applies. |
| `SemanticSceneApp<Model, M>` | `App<Model, M> & SceneProjection<Model, M>`. |
| `UiActionRequest` | What a host sends: `actionId` and an optional `value`. |
| `UiActionValue` | `string`, `number`, or `boolean`. |
| `UiActionInvocation` | What `dispatchAction()` receives: `actionId`, `command`, and, when present, `targetNodeId` and `value`. |
| `SemanticSceneFrame<Model>` | A `model` and the validated `scene` projected from it. |
| `SemanticSceneDiagnostic` | Why a request was ignored: `code`, `actionId`, `sceneId`, and `message`. |
| `SemanticSceneCrash<Model>` | The failure that stopped the controller: `phase`, `error`, and the `model` that was kept. |

The controller fills `command` and `targetNodeId` from the action that the
current scene declares. A host cannot supply them.

## Controller

`createSemanticSceneController(app, options)` calls `app.init()`, projects
and validates the first scene, and runs the commands from `init()`.

| Option | Meaning |
| --- | --- |
| `ctx` | Required. The `BijouContext` that `viewScene()` receives. Its clock drives the bus that the controller creates. |
| `bus` | The host's `EventBus`. Without it, the controller creates one and disposes it on `stop()`. The controller never disposes a bus that the host supplied. |
| `onDiagnostic` | Called with each `SemanticSceneDiagnostic`. |
| `onCrash` | Called once with the `SemanticSceneCrash`. |

| Member | Result |
| --- | --- |
| `bus` | The one `EventBus` that carries every message to `app.update()`. A host emits key, resize, and other messages here. |
| `status` | `running`, `crashed`, or `stopped`. |
| `frame()` | The current `SemanticSceneFrame`. |
| `crash()` | The `SemanticSceneCrash`, or `undefined`. |
| `invoke(request)` | Dispatches one action request. See [Dispatch](#dispatch). |
| `subscribe(listener)` | Calls `listener` with each new frame. Returns a handle with `dispose()`. |
| `stop()` | Stops handling messages. A second call does nothing. |

The controller subscribes to the bus once. For each message it calls
`app.update()`. When the returned model is a different object, it projects
and validates a new scene, stores the new frame, and calls the listeners. Then
it runs the returned commands with `bus.runCmd()`, so a message that a command
returns goes through the same bus. When `update()` returns the same model
object, the frame is kept and the commands still run.

A command that returns `QUIT` stops the controller.

## Dispatch

`invoke(request)` returns one of three results.

| `status` | When | Other fields |
| --- | --- | --- |
| `dispatched` | The current scene declares the action, and `dispatchAction()` returned a message. The controller emitted the message on the bus. | `invocation`, `message` |
| `ignored` | The request was not dispatched. The model and the scene are unchanged. | `diagnostic` |
| `crashed` | `dispatchAction()`, `update()`, or the new scene failed during this call. | `crash` |

`invoke()` looks for the action id only in `frame().scene.actions`. An id
that an earlier scene declared and the current scene does not is ignored.

| Diagnostic `code` | Meaning |
| --- | --- |
| `action-not-declared` | The current scene has no action with this id. |
| `action-unhandled` | The scene declares the action, and `dispatchAction()` returned `undefined`. |
| `controller-crashed` | The controller crashed before this request. |
| `controller-stopped` | The controller stopped before this request. |

`dispatched` means that the message was emitted. Bus middleware can still drop
or change a message before `update()` receives it.

## Failures

`createSemanticSceneController()` throws when the first scene fails
`validateUiSceneIr()`. The error message lists each issue code and message.

After that, the controller does not throw for an app failure. It records a
crash, calls `onCrash`, sets `status` to `crashed`, and ignores later messages
and requests.

| `phase` | Failure |
| --- | --- |
| `dispatch` | `dispatchAction()` threw. |
| `update` | `update()` threw. |
| `view` | `viewScene()` threw, or the new scene failed `validateUiSceneIr()`. |

A crash keeps the last valid frame. For a `view` crash, the model that
`update()` returned is discarded and its commands do not run.

The terminal runtime shows a crash screen when `update()` throws. The
controller has no screen. The host reads `crash()` and decides what to show.

## Browser seam attributes

The [browser renderer seam](../ui-scene-browser/README.md) writes scene facts
as element attributes. The contract names the two that a host needs to send an
action:

| Constant | Value | Holds |
| --- | --- | --- |
| `UI_SCENE_NODE_ID_ATTRIBUTE` | `data-bijou-node-id` | The node id. Every node element has it. |
| `UI_SCENE_ACTION_ATTRIBUTE` | `data-bijou-action` | The action ids of the node, separated by spaces. |

`parseUiSceneActionAttribute(value)` splits a `data-bijou-action` value into
action ids, in order. One element can carry more than one action id. The host
chooses which id to send.

## Replay

`replaySemanticSceneActions(controller, requests)` calls `invoke()` for each
request in order. It returns one checkpoint for each request: the `request`,
the `result`, and the `model` and `scene` after it.

The replay is synchronous. A message that a command returns later is not part
of a checkpoint. To include it, wait for `controller.bus.drain()` and read
`frame()`.

## Example

This example is illustrative. `panelApp` stands for any
`SemanticSceneApp`; the test fixture is `createPanelApp()` in
`packages/bijou-tui/src/semantic-scene.test-support.ts`.

```ts
import { createSemanticSceneController } from '@flyingrobots/bijou-tui';

const controller = createSemanticSceneController(panelApp, { ctx });

controller.subscribe(({ scene }) => {
  // Lower or patch the scene for the host.
});

const result = controller.invoke({ actionId: 'panel.rename', value: 'Ada' });
if (result.status === 'ignored') {
  // result.diagnostic.code says why.
}

controller.stop();
```

## Limits

- The contract is not connected to `run()`. The terminal runtime does not call
  `viewScene()` or `dispatchAction()`.
- No DOM host exists in this repository yet. The tests run the controller with
  two different `BijouContext` values and bus owners, not in a browser.
- The controller projects the whole scene after each model change. It does not
  compare scenes or produce patches.
- The browser renderer seam lowers `group` and `text` nodes only, and it has no
  attribute for an input value. A host supplies the `value` of a request.
