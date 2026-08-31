---
'@expressive-code/plugin-frames': minor
---

Adds a new `removeDeletedTextWhenCopying` option to remove text marked as "deleted" when copying. This option is false by default for backwards-compatibility.

If `removeDeletedTextWhenCopying` is true, any lines or segments of code that are marked as deleted using the `plugin-text-markers` plugin are not included when copied to the clipboard. This will also disallow the selection of said deleted lines or segments.
