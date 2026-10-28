---
'astro-expressive-code': patch
---

Fixes `<Code>` components linking to a stylesheet that was never emitted if an `ec.config.mts` file was present. Vite resolved this file for the `<Code>` component while the integration ignored it, so Markdown code blocks and `<Code>` components used different configs. Now both only load `ec.config.mjs`, and a warning is logged if an EC config file with an unsupported extension like `.ts` or `.mts` is found.
