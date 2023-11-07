---
'@expressive-code/plugin-collapsible-sections': minor
'@expressive-code/plugin-text-markers': minor
'@expressive-code/plugin-frames': minor
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
'expressive-code': minor
---

Move all plugin styles into nested sub-objects of top-level config option `styleOverrides`.

In previous versions, there could be multiple `styleOverrides` scattered through the configuration (one per plugin with configurable style settings). This has been simplified to a single top-level `styleOverrides` object that contains all style overrides.

Plugins can contribute their own style settings to this object as well by nesting them inside under their plugin name.

```diff lang="js"
  /** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
  const remarkExpressiveCodeOptions = {
    frames: {
      showCopyToClipboardButton: false,
-     styleOverrides: {
-       shadowColor: '#124',
-     },
    },
+   styleOverrides: {
+     frames: {
+       shadowColor: '#124',
+     },
+     // You could override other plugin styles here as well:
+     // textMarkers: { ... },
+   },
  },
```
