---
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
---

Improve theme loading by allowing to pass more theme types directly.

The `theme` config option now supports the following value types:

- any theme object compatible with VS Code or Shiki (e.g. imported from an NPM theme package)
- any ExpressiveCodeTheme instance (e.g. using `ExpressiveCodeTheme.fromJSONString(...)`
  to load a custom JSON/JSONC theme file yourself)
- if you are using a higher-level integration like `remark-expressive-code` or `astro-expressive-code`:
  - any theme name bundled with Shiki (e.g. `dracula`)
- any combination of the above in an array
