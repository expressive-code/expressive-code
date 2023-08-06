---
'@expressive-code/plugin-frames': minor
'astro-expressive-code': minor
'expressive-code': minor
'remark-expressive-code': minor
---

Add `removeCommentsWhenCopyingTerminalFrames` config option to `plugin-frames`. Thanks @AkashRajpurohit!

If `true` (which is the default), the "Copy to clipboard" button of terminal window frames will remove comment lines starting with `#` from the copied text.

This is useful to reduce the copied text to the actual commands users need to run, instead of also copying explanatory comments or instructions.
