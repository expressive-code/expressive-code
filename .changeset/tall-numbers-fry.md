---
'@expressive-code/plugin-shiki': minor
'remark-expressive-code': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
---

Migrates syntax highlighting back to Shiki.

After the improvements made in Shikiji were merged back into Shiki, Expressive Code now uses Shiki again for syntax highlighting.

**Potentially breaking:** Although we performed a lot of testing, the migration might cause slightly different highlighting in some cases, as the latest full bundle of Shiki includes various new and updated grammars. We recommend checking if syntax highlighting still looks as expected on your site.
