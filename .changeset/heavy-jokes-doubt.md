---
'@expressive-code/core': minor
'astro-expressive-code': minor
'expressive-code': minor
'rehype-expressive-code': minor
---

Adds new `preventUnitlessValues` property to `PluginStyleSettings`.

Plugins can set this property to an array of style setting paths to prevent unitless values for specific style settings. If the user passes a unitless value to one of these settings, the engine will automatically add `px` to the value. This is recommended for settings used in CSS calculations which would otherwise break if a unitless value is passed.
