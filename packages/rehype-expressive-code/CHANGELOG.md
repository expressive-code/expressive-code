# rehype-expressive-code

## 0.35.0

### Minor Changes

- 1875948: Adds the new package `rehype-expressive-code` as the successor to `remark-expressive-code`, which is now considered deprecated.

  If you're using the Astro integration `astro-expressive-code`, you will be automatically using the new package and don't need to do anything.

  If your project has a dependency on `remark-expressive-code`, you should replace it with `rehype-expressive-code` and pass it as a rehype plugin instead of a remark plugin. See the [installation instructions](https://expressive-code.com/installation/#nextjs) for an example.

  The new package includes performance improvements and also works with the latest versions of MDX in popular site generators.

### Patch Changes

- Updated dependencies [1875948]
  - expressive-code@0.35.0
