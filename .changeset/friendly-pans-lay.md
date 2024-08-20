---
'@expressive-code/plugin-shiki': minor
'astro-expressive-code': minor
'expressive-code': minor
'rehype-expressive-code': minor
---

Adds the experimental `transformers` option to the Shiki plugin. Thank you @MichaelMakesGames!

This option allows you to specify a list of Shiki transformers to be called during syntax highlighting.

**Important:** This option is marked as experimental because it only supports a **very limited subset** of Shiki transformer features right now. Most importantly, transformers cannot modify a code block's text contents in any way, so most popular transformers will not work.

In its current state, this option allows you to use transformers that solely modify the tokens produced by Shiki to improve syntax highlighting, e.g. applying bracket matching or changing the color of certain tokens.

Attempting to pass incompatible transformers to this option will throw an error. This is not a bug, neither in Expressive Code, nor in Shiki or the transformers. Please do not report incompatibilities to other authors, as they are unable to fix them. The current limitations exist because the Shiki transformer API is incompatible with Expressive Code's architecture, and we will continue to work on closing the gap and improving this feature.
