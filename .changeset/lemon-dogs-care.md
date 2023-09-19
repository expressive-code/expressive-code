---
'@expressive-code/plugin-collapsible-sections': minor
'@expressive-code/core': minor
---

Migrate i18n functions to string templates with plural support.

Translated texts including dynamic parts (e.g. a line count) previously used a function syntax. This was convenient to use during plugin development, but made it impossible to use the popular JSON file format as a source of translated texts. To make it easier to integrate Expressive Code, this release gets rid of the function syntax and adds a `formatTemplate` function that understands a simple string template syntax including placeholders and plural support.

Simple placeholders are written as variable names in curly brackets, e.g. `{variableName}`.

You can also use conditional placeholders by separating multiple choices with semicolons and optionally adding a condition before each choice, e.g. `{itemCount;1=item;items}` or `{variableName; 0=zero; >0=positive; negative}`.
