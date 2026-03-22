# `hyperlink()`

Trusted terminal links with explicit fallback behavior.

## Run

```sh
npx tsx examples/hyperlink/main.ts
```

## Use this when

- the destination itself should remain visible and trustworthy in terminal output
- supported terminals can benefit from OSC 8 clickability
- the link belongs in surrounding prose or help text instead of an app-owned command surface

## Choose something else when

- avoid vague labels like “click here” that hide where the destination goes
- avoid using `hyperlink()` for app actions that should stay inside the TUI
- when trust depends on the host or full destination, make sure the fallback or surrounding text keeps it explicit

## What this example proves

- clickable OSC 8 links in supporting terminals
- explicit fallback modes that preserve destination meaning in other terminals
- hyperlink text as a trustworthy destination label, not decorative chrome

[← Examples](../README.md)
