# VISION

Bijou is trying to become a serious, humane terminal-software toolkit
whose runtime truth, design language, and documentation all agree with
each other.

The product direction is not "more terminal widgets." It is a tighter
combination of:

- a runtime-engine core with explicit state, view, layout, routing,
  command, and effect seams
- a performance foundation built on typed arrays and zero-allocation
  rendering — the surface layer speaks bytes, not strings
- a humane shell model that stays truthful under keyboard, mouse,
  compact viewport, accessibility, and localization pressure
- a DOGFOOD docs surface that proves the framework in the same repo that
  publishes it
- an MCP rendering service that makes Bijou usable outside the terminal
  — AI tools can render components and query documentation directly
- tests and cycle docs that make behavior explainable to both humans and
  agents

Near-horizon Bijou work should therefore favor:

- proving the performance foundation in real apps and closing the
  remaining synthetic benchmark gaps
- deepening DOGFOOD story quality and design-language surfaces
- building interactive, machine-readable documentation for all
  components
- tightening developer-facing API seams where they block real usage
- keeping repo truth bounded and inspectable through METHOD signposts

Broad roadmap ideas still matter, but they should not outrank the
current repo-visible proof of what Bijou is actually becoming.
