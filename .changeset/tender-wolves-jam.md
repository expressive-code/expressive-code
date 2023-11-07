---
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
'expressive-code': minor
---

Rename config option `theme` to `themes`.

Efficient multi-theme support using CSS variables is now a core feature, so the `theme` option was deprecated in favor of the new array `themes`.

Please migrate your existing config to use `themes` and ensure it is an array. If you only need a single theme, your `themes` array can contain just this one theme. However, please consider the benefits of providing multiple themes.

```diff lang="js"
  /** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
  const remarkExpressiveCodeOptions = {
-   theme: 'dracula',
+   // Rename to `themes` and ensure it is an array
+   // (also consider adding a light theme for accessibility)
+   themes: ['dracula'],
  },
```
