---
'rehype-expressive-code': patch
---

Fixes style and script assets not loading properly when used with MDX in Next.js.

The MDX processing chain used by current Next.js versions caused unwanted escaping of the Expressive Code inline assets, which resulted in hydration issues and prevented features that depend on JS modules like the copy button from working.

In these cases, Expressive Code now uses a different approach to inject the inline assets to ensure that no unwanted escaping occurs.
