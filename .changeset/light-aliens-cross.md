---
'@expressive-code/plugin-frames': patch
'astro-expressive-code': patch
'expressive-code': patch
'rehype-expressive-code': patch
---

Prevents the frames plugin from treating Twoslash `// @filename` directives as filename comments. This keeps multi-file Twoslash code blocks intact. Thank you for the report, @Adammatthiesen!
