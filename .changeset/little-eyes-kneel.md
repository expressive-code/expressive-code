---
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
'expressive-code': minor
---

Add `useDarkModeMediaQuery` config option.

This new option determines if CSS code is generated that uses a `prefers-color-scheme` media query to automatically switch between light and dark themes based on the user's system preferences.

Defaults to `true` if your `themes` option is set to one dark and one light theme (which is the default), and `false` otherwise.
