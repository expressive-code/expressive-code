---
'astro-expressive-code': minor
---

Adds the capability to use multiple config sources (Astro / Starlight config + `ec.config.mjs` file) simultaneously.

If both config sources are used, they get merged on a per-option basis, with the options from the `ec.config.mjs` file taking precedence.

For the following object options, a deep merge of all nested properties is performed, allowing you to perform granular overrides:

- `defaultProps`
- `frames`
- `shiki`
- `styleOverrides`

Also, the following array options are concatenated instead of being replaced:

- `shiki.langs`
