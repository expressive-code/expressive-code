---
'@expressive-code/plugin-collapsible-sections': patch
'@expressive-code/plugin-text-markers': patch
'@expressive-code/plugin-frames': patch
'@expressive-code/plugin-shiki': patch
'@expressive-code/core': patch
'astro-expressive-code': patch
'expressive-code': patch
'remark-expressive-code': patch
---

Pass global `styleOverrides` to plugin style resolver functions.

This allows plugins to access their individual `styleOverrides` extensions even when values were defined at the global config level.
