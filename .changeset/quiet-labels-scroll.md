---
'@expressive-code/core': patch
'expressive-code': patch
'rehype-expressive-code': patch
'astro-expressive-code': patch
---

Gives scrollable code blocks an accessible name. When a code block overflows horizontally, its `<pre>` element now gets `role="group"` and an `aria-label` instead of an unnamed `role="region"`. Both are removed again when the code block fits. This fixes the axe `landmark-unique` violation on pages with several scrollable code blocks.

The default label is "Scrollable code". You can translate or change it through the new `coreTexts` export, which works like the localized texts of the other plugins:

```js
import { coreTexts } from 'astro-expressive-code'

coreTexts.overrideTexts('es', { scrollableCodeLabel: 'Código desplazable' })
```
