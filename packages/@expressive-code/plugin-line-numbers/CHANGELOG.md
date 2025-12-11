# @expressive-code/plugin-line-numbers

## 0.41.4

### Patch Changes

- @expressive-code/core@0.41.4

## 0.41.3

### Patch Changes

- Updated dependencies [eb82591]
  - @expressive-code/core@0.41.3

## 0.41.2

### Patch Changes

- @expressive-code/core@0.41.2

## 0.41.1

### Patch Changes

- Updated dependencies [a53e749]
  - @expressive-code/core@0.41.1

## 0.41.0

### Patch Changes

- Updated dependencies [380bfcc]
- Updated dependencies [0f33477]
- Updated dependencies [6497f09]
- Updated dependencies [a826a4a]
- Updated dependencies [0f33477]
- Updated dependencies [0f33477]
  - @expressive-code/core@0.41.0

## 0.40.2

### Patch Changes

- Updated dependencies [1734d73]
  - @expressive-code/core@0.40.2

## 0.40.1

### Patch Changes

- Updated dependencies [ecf6ca1]
  - @expressive-code/core@0.40.1

## 0.40.0

### Patch Changes

- @expressive-code/core@0.40.0

## 0.39.0

### Patch Changes

- @expressive-code/core@0.39.0

## 0.38.3

### Patch Changes

- @expressive-code/core@0.38.3

## 0.38.2

### Patch Changes

- @expressive-code/core@0.38.2

## 0.38.1

### Patch Changes

- Updated dependencies [440bb83]
  - @expressive-code/core@0.38.1

## 0.38.0

### Patch Changes

- @expressive-code/core@0.38.0

## 0.37.1

### Patch Changes

- afcf11e: Adds `aria-hidden="true"` to line numbers to prevent them from being read out loud and interrupting the flow of the code. Thank you @Yesterday17!
  - @expressive-code/core@0.37.1

## 0.37.0

### Patch Changes

- @expressive-code/core@0.37.0

## 0.36.1

### Patch Changes

- @expressive-code/core@0.36.1

## 0.36.0

### Patch Changes

- Updated dependencies [ca54f6e]
  - @expressive-code/core@0.36.0

## 0.35.6

### Patch Changes

- @expressive-code/core@0.35.6

## 0.35.5

### Patch Changes

- @expressive-code/core@0.35.5

## 0.35.4

### Patch Changes

- Updated dependencies [876d24c]
  - @expressive-code/core@0.35.4

## 0.35.3

### Patch Changes

- @expressive-code/core@0.35.3

## 0.35.2

### Patch Changes

- Updated dependencies [dd54846]
  - @expressive-code/core@0.35.2

## 0.35.1

### Patch Changes

- @expressive-code/core@0.35.1

## 0.35.0

### Patch Changes

- @expressive-code/core@0.35.0

## 0.34.2

### Patch Changes

- Updated dependencies [cbc16e9]
  - @expressive-code/core@0.34.2

## 0.34.1

### Patch Changes

- Updated dependencies [1b2279f]
  - @expressive-code/core@0.34.1

## 0.34.0

### Minor Changes

- b94a91d: Updates dependencies `hast`, `hastscript` and `hast-util-*` to the latest versions.

  **Potentially breaking change:** Unfortunately, some of the new `hast` types are incompatible with their old versions. If you created custom plugins to manipulate HAST nodes, you may need to update your dependencies as well and probably change some types. For example, if you were using the `Parent` type before, you will probably need to replace it with `Parents` or `Element` in the new version.

- b94a91d: Adds a new `/hast` entrypoint to `@expressive-code/core`, `expressive-code`, `remark-expressive-code` and `astro-expressive-code` to simplify plugin development.

  This new entrypoint provides direct access to the correct versions of HAST types and commonly used tree traversal, querying and manipulation functions. Instead of having to add your own dependencies on libraries like `hastscript`, `hast-util-select` or `unist-util-visit` to your project and manually keeping them in sync with the versions used by Expressive Code, you can now import the internally used functions and types directly from this new entrypoint.

- b6e7167: **Potentially breaking change:** Since this version, all packages are only distributed in modern ESM format, which greatly reduces bundle size.

  Most projects should not be affected by this change at all, but in case you still need to import Expressive Code packages into a CommonJS project, you can use the widely supported `await import(...)` syntax.

### Patch Changes

- Updated dependencies [af2a10a]
- Updated dependencies [b94a91d]
- Updated dependencies [af2a10a]
- Updated dependencies [9eb8619]
- Updated dependencies [b6e7167]
- Updated dependencies [2ef2503]
- Updated dependencies [b94a91d]
  - @expressive-code/core@0.34.0

## 0.33.5

### Patch Changes

- Updated dependencies [2469749]
  - @expressive-code/core@0.33.5

## 0.33.4

### Patch Changes

- @expressive-code/core@0.33.4

## 0.33.3

### Patch Changes

- @expressive-code/core@0.33.3

## 0.33.2

### Patch Changes

- Updated dependencies [a408e31]
  - @expressive-code/core@0.33.2

## 0.33.1

### Patch Changes

- Updated dependencies [f3ac898]
  - @expressive-code/core@0.33.1

## 0.33.0

### Minor Changes

- b7a0607: Releases initial version of new optional plugin `@expressive-code/plugin-line-numbers`.

  See the full [plugin documentation](https://expressive-code.com/plugins/line-numbers/) for more information.

### Patch Changes

- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
  - @expressive-code/core@0.33.0
