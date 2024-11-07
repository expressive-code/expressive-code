---
'@expressive-code/plugin-shiki': patch
'astro-expressive-code': patch
'expressive-code': patch
'rehype-expressive-code': patch
---

Makes the types used by the `shiki.langs` config option less strict to align them better with actual grammars found in the wild. This attempts to reduce the amount of type errors that occurred before when using external grammars, while still being supported by the language processing code.
