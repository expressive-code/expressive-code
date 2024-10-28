---
'astro-expressive-code': minor
---

Adds config merging functionality to `astro-expressive-code`, which allows using `ec.config.mjs` together with other configuration sources like the Astro / Starlight config or Starlight themes.

Options defined in `ec.config.mjs` have the highest priority and will override any corresponding values coming from other configuration sources.

For the following object options, a deep merge is performed instead of a simple override:

- `defaultProps`
- `frames`
- `shiki`
- `styleOverrides`

The following array options are concatenated instead of being replaced:

- `shiki.langs`
