---
'astro-expressive-code': minor
---

Improves plugin development experience by automatically restarting the dev server if any files imported into `ec.config.mjs` are changed.

Before this update, only changes to `ec.config.mjs` itself were detected, so plugin development had to be done inside the config file if you wanted to see your changes reflected live in the dev server. Now, you can also develop your plugins in separate files and get the same experience.

Note: As this feature relies on Vite's module dependency graph, it currently only works if there is at least a single `<Code>` component on the page (which uses imports handled by Vite).
