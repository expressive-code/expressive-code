---
'@expressive-code/plugin-text-markers': minor
'remark-expressive-code': minor
'astro-expressive-code': minor
'expressive-code': minor
---

Config option `textMarkers` can no longer be an object.

In previous versions, the `textMarkers` config option could be an object containing plugin options. This is no longer supported, as the only option that was available (`styleOverrides`) has been nested into the top-level `styleOverrides` object now.

```diff lang="js"
  /** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
  const remarkExpressiveCodeOptions = {
-   textMarkers: {
-     styleOverrides: {
-       markHue: '310',
-     },
-   },
+   styleOverrides: {
+     textMarkers: {
+       markHue: '310',
+     },
+     // You could override other plugin styles here as well:
+     // frames: { ... },
+   },
  },
```
