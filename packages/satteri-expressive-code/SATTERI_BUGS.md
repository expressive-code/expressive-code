# Satteri issues noticed during satteri-expressive-code development

## Async HAST visitors are dispatched concurrently within a plugin

When a HAST plugin has an async visitor (returns a Promise), satteri calls the
visitor for every matched node synchronously, collects the Promises, then resolves
them all via `Promise.all`. This means async visitors for different nodes run
concurrently rather than sequentially.

Verified in satteri 0.2.4 with a minimal test: three paragraphs visited by an
async visitor that logs before and after `await setTimeout(10)` produces the
order `0-start, 1-start, 2-start, 0-end, 1-end, 2-end`. A sequential dispatch
would produce `0-start, 0-end, 1-start, 1-end, 2-start, 2-end`.

Every other AST tool in this space (LightningCSS, SWC, Babel, PostCSS, unified)
processes visitors sequentially — each call completes before the next node is
dispatched. Satteri is unique in racing async visitors against each other.

This causes problems for plugins with cross-node state:
- Asset deduplication (inject styles on first block, skip on subsequent)
- Document-order numbering or cross-references
- Cumulative transforms where node N depends on the result of node N-1

The workaround in satteri-expressive-code is a synchronous counter incremented
before the first `await`, which works because the sync preamble of each visitor
still runs in dispatch order. But this is subtle and fragile.

Suggested fix: await each async visitor sequentially in `dispatchMatches` (change
`Promise.all(deferred)` to a sequential loop). This matches every other tool's
behavior. Plugins that want concurrency could opt in via a flag.

Relevant code: `packages/satteri/src/hast/hast-visitor.ts`, `dispatchMatches`
function and `visitHastHandle`.

## Fixed in 0.2.4

- **HTML attribute naming** (`className` → `class`, `dataLanguage` → `data-language`,
  etc.): satteri's renderer now converts HAST JS-style property names back to
  standard HTML attribute names.
- **Script tag content escaping**: `<script>` content is now emitted as raw text
  instead of being HTML-entity-escaped, so `=>` and `&&` survive as valid JS.
