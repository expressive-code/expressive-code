---
'@expressive-code/plugin-frames': minor
'astro-expressive-code': minor
'expressive-code': minor
'remark-expressive-code': minor
---

Render frame borders on top of background, add `editorActiveTabHighlightHeight` style setting.

Previously, borders were rendered around the editor / terminal window, which could lead to unwanted empty margins between the window background and the drop shadow (e.g. in theme `nord`). Now, the border is rendered on top of the background to resolve this issue, making fully transparent borders act like padding instead.

Additionally, the `editorActiveTabHighlightHeight` style setting was introduced, which allows customizing the colorful line that highlights the active editor tab. It defaults to `borderWidth`.
