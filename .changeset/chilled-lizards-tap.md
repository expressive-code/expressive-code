---
'@expressive-code/plugin-text-markers': patch
'@expressive-code/core': patch
'astro-expressive-code': patch
'expressive-code': patch
'remark-expressive-code': patch
---

Improves automatic color contrast correction when using CSS variables in styleOverrides. Thanks @heycassidy!

It is now possible to use CSS variables in the `styleOverrides` setting `codeBackground` without negatively affecting the automatic color contrast correction controlled by the `minSyntaxHighlightingColorContrast` setting. If a CSS variable is encountered that cannot be resolved to a color value on the server, Expressive Code now automatically uses the theme's background color as a fallback for color contrast calculations. You can also provide your own fallback color using the CSS variable fallback syntax, e.g. `var(--gray-50, #f9fafb)`.
