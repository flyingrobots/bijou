# RE-033 Stable Spring Pulse Integration

## Sponsored Users

- Application builders using `@flyingrobots/bijou-tui` spring animation for
  camera controls, pane motion, drawers, or other interactive UI state.
- Terminal users on slow, remote, or overloaded shells where frame pulses can
  arrive late or in large bursts.
- Agents debugging Bijou apps from event streams rather than visual intuition.

## Problem

`animate({ type: 'spring' })` currently integrates spring physics with the raw
runtime pulse delta. A slow frame can therefore hand `springStep()` a very large
`dt`, and semi-implicit Euler integration can convert one delayed pulse into a
large velocity and position spike.

Apps can patch around this by implementing their own bounded fixed-timestep
command, but the invariant belongs in Bijou: a spring command should stay stable
when the terminal slows down.

## Hills

1. A builder can use Bijou's default spring animation in a slow terminal without
   writing app-local `dt` clamps.
2. A user holding an animated control during a delayed frame sees motion slow or
   catch up conservatively, not explode past the intended state.
3. An agent can prove spring stability with a focused test that drives the
   command with large pulse deltas.

## Playback Questions

1. If a spring receives a one-second pulse, does the first emitted value remain
   bounded between the start and target for a critically damped spring?
2. Does the animation still settle at the exact target value and emit completion
   normally?
3. Does the fix live inside Bijou's `animate()` spring command rather than in
   downstream application code?

## Requirements

- Spring animation commands must integrate using bounded fixed timesteps.
- Large pulse deltas must not be applied to `springStep()` as one raw step.
- The default behavior must remain app-friendly without requiring new options.
- Tween animation behavior is out of scope for this cycle.
- Existing `animate()` and `sequence()` public call sites must remain source
  compatible.

## Acceptance Criteria

- `packages/bijou-tui/src/animate.test.ts` includes a slow-pulse spring
  regression.
- `packages/bijou-tui/src/animate.ts` bounds spring integration internally.
- Existing spring, tween, immediate, and sequence tests continue to pass.
- `npm run test -- packages/bijou-tui/src/animate.test.ts` passes.
- `npm run --workspace @flyingrobots/bijou-tui lint` passes.
- `git diff --check` passes.

## Design

Use a small fixed-step accumulator inside `createSpringCmd()`.

The command should:

- accumulate pulse time;
- cap the amount of pulse time accepted per runtime pulse;
- step `springStep()` in fixed increments;
- emit at most one frame per runtime pulse after it has stepped;
- dispose and emit `onComplete()` exactly as before when the spring settles.

Dropping excessive slow-frame time is intentional. A terminal animation should
prefer stable, slightly delayed motion over trying to simulate a full stalled
second in one event loop turn.

## RED

Initial RED test: a critically damped spring from `0` to `100` receives repeated
one-second pulses. With raw `dt` integration, the first frame jumps far beyond
the target.

The initial run failed in `packages/bijou-tui/src/animate.test.ts` because the
spring did not settle under the slow-pulse sequence.

## GREEN

`createSpringCmd()` now accumulates runtime pulse time, accepts at most a small
bounded pulse window, and advances spring physics with fixed timesteps. It emits
one frame after one or more physics steps and preserves the existing completion
path.

The public `animate()` call remains source-compatible. Spring callers may tune
`fixedStepSeconds` and `maxPulseSeconds`, but the defaults are stable without
new app code.

## Drift Check

- `npm run test -- packages/bijou-tui/src/animate.test.ts` passed.
- `npm run --workspace @flyingrobots/bijou-tui lint` passed.
- `npm run lint` passed.
- `git diff --check` passed.

## Playback

Playback answers:

1. A one-second pulse no longer reaches `springStep()` as one raw integration
   step; the regression proves a critically damped spring remains bounded.
2. The command still resolves at the exact target value and preserves
   completion semantics.
3. The fix lives inside `packages/bijou-tui/src/animate.ts`, not in an
   app-local workaround.

## Retrospective

The jedit camera failure was a useful dogfood signal: spring stability is a
framework guarantee, not an application responsibility. This cycle intentionally
kept scope to spring integration. A broader frame scheduler remains a better
future home for runtime-wide pulse policy, but `animate()` is now safe by
default for the existing public API.
