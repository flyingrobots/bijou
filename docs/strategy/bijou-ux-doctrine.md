# BIJOU UX DOCTRINE

Bijou is a high-fidelity terminal UI engine with an explicit design stance on runtime truth, shell honesty, and human-centered interaction.

## Core Tenets

### 1. Focus Owns Input
The active region must be unambiguous and possess the primary control surface. The user should never wonder whether a keypress affects the current pane, a hidden modal, or a stale footer hint.

### 2. Visible Controls Are a Promise
If a control hint is visible, it must function for the active layer. Advertising inactive or covered controls is a failure of shell integrity.

### 3. Structural Selection
Selection should be communicated through background fill, structural emphasis, or positional glyphs. Color may reinforce selection but must not be the sole differentiator.

### 4. Density Requires Rhythm
TUI density is an industrial strength, not a license for visual noise. Gutters, margins, and consistent rhythm between labels and values must be preserved.

### 5. The Shell is a Product
The app frame—header, footer, help, search, settings, and notifications—is a unified human-facing product. It exists to orient the operator, centralize common behavior, and reduce anxiety.

### 6. Graceful Lowering is an Obligation
Rich interactive mode is one profile. Bijou preserves semantic truth across `static`, `pipe`, and `accessible` modes. Lower profiles do not need visual parity; they require semantic honesty.

### 7. Accessibility is a Substrate Property
Bijou considers reading order, low-vision, color-blindness, and cognitive load at the engine level. An application is not accessible merely because a component can lower to text.

### 8. Localization is Geometric
Locale affects wording, wrapping, and reading direction. Bijou avoids hardcoded assumptions that prioritize English or LTR layouts.

### 9. AI Surfaces Must Explain
AI-mediated output must be explicit about its nature, evidence, and confidence. It should guide the operator toward the expected next action.

## Interaction Patterns

- **Keyboard-First, Mouse-Enhanced**: Everything important remains reachable by keyboard. Mouse input enhances this truthful model through spatial interaction.
- **Topmost Layer Dismisses First**: Layered TUIs must be predictable. The top dismissible layer always owns input and is the first to be dismissed by `Esc`.
- **Top Layer Owns Visible Controls**: The layer on top owns the visible prompts, controls, and escape affordances until it yields or dismisses.
- **DOGFOOD is the Proving Ground**: The documentation itself must exercise the shell, search, and accessibility posture truthfully.
- **Doctrine Before Blocks**: Reusable blocks come after interaction doctrine, not before it; policy should shape components instead of the other way around.

---
**The goal is to move the terminal from a collection of widgets to a professional application bedrock.**
