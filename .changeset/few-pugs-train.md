---
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
---

Add config option `customizeTheme`.

This optional function is called once per theme during engine initialization with the loaded theme as its only argument.

It allows customizing the loaded theme and can be used for various purposes:

- You can change a theme's `name` property to influence its generated CSS class name (e.g. `theme.name = 'dark'` will result in code blocks having the class `ec-theme-dark`).
- You can create color variations of themes by using `theme.applyHueAndChromaAdjustments()`.
