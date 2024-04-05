---
'@expressive-code/plugin-text-markers': minor
'@expressive-code/plugin-frames': minor
'@expressive-code/core': minor
'astro-expressive-code': minor
---

Makes Expressive Code compatible with Bun. Thank you @tylergannon for the fix and @richardguerre for the report!

This fixes the error `msg.match is not a function` that was thrown when trying to use Expressive Code with Bun.

Additionally, the `type` modifier was added to some imports and exports to fix further Bun issues with plugins and integrations found during testing.
