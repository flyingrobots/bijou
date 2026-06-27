# Theme Rule Recipes

Theme rules let Bijou themes describe how semantic colors are selected instead
of only storing final hex values.

The runtime contract is unchanged:

```text
primitive colors
  -> selector rules
    -> TokenGraph
      -> ThemeAccessors
        -> terminal rendering
```

Rules live in `@flyingrobots/bijou`. They do not depend on external design
token packages and they compile to the same `TokenValue` objects the renderer
already consumes.

## When To Use Rules

Use a rule when a token should follow a stable decision:

- readable foreground on a known surface
- vivid accent that must not reuse success or error
- muted candidate that still clears a contrast floor
- closest palette color to a target
- ordered ramp position such as the middle or final stop

Do not use rules to hide one-off taste decisions. If the product needs exactly
one named color, write the token directly.

## Primitive To Semantic Flow

Start with primitive colors, then derive product roles from them:

```ts
import {
  bestContrastWith,
  createTokenGraph,
  mostVivid,
  scope,
} from '@flyingrobots/bijou';

const graph = createTokenGraph({
  palette: {
    ink: '#0b1020',
    paper: '#f8fafc',
    blue: '#3399ff',
    green: '#22c55e',
    red: '#ef4444',
  },
  surface: {
    primary: { fg: '#f8fafc', bg: { ref: 'palette.ink' } },
  },
  semantic: {
    primary: bestContrastWith({ ref: 'surface.primary.bg' }, scope('palette')),
    accent: mostVivid(scope('palette'), {
      against: { ref: 'surface.primary.bg' },
      minContrast: 4.5,
      not: ['palette.green', 'palette.red'],
    }),
  },
});
```

`semantic.primary` is now "the highest-contrast palette color on the primary
surface." `semantic.accent` is "the most vivid readable palette color that is
not reserved for success or error."

## Inspect The Decision

Rules are useful only when they can explain themselves:

```ts
const fact = graph.inspect('semantic.accent');
```

The inspection fact includes:

- the rule id
- the selected candidate
- candidate paths and resolved colors
- excluded candidates
- contrast failures
- dependency paths

This is the data future Theme Inspector and Theme Lab surfaces should render.
They should not infer token ownership from RGB equality or screenshots.

## Selector Vocabulary

`bestContrastWith(target, candidates)` chooses the highest-contrast candidate.

`minContrastWith(target, candidates, { ratio })` chooses the first candidate
that reaches the requested contrast ratio.

`mostVivid(candidates, options)` chooses the highest-chroma candidate; it is
readable only when `against` and `minContrast` are provided.

`leastVivid(candidates, options)` chooses the lowest-chroma candidate; it uses
the same readability rule.

`closestColor(target, candidates)` chooses the closest RGB candidate.

`nthColor(candidates, index)` chooses an ordered candidate by integer or
relative index.

Candidate scopes are deterministic. `scope('palette')` reads direct children
of the `palette` scope in definition order.

## Lower-Mode Rule

Rules improve color choice. They do not make color the only source of meaning.

Every UI that consumes these tokens still needs labels, symbols, structure, or
state text that survives `NO_COLOR`, pipe output, and accessible lowering.
