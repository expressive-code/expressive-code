# astro-expressive-code

## 0.41.3

### Patch Changes

- eb82591: Fixes WCAG 4.1.2 compliance issue by dynamically adding `role="region"` to scrollable code blocks. Thank you @ruslanpashkov!
- Updated dependencies [eb82591]
  - rehype-expressive-code@0.41.3

## 0.41.2

### Patch Changes

- 013f07a: Fixes an issue where the deprecated, but still available `theme` option was not being taken into account during SSR bundle trimming.
- 013f07a: Improves the error message when the `<Code>` component is being used on a page without having the Astro integration enabled in the project.
  - rehype-expressive-code@0.41.2

## 0.41.1

### Patch Changes

- a53e749: Fixes a regression that caused inline text markers to be rendered with two layered background colors.
- Updated dependencies [a53e749]
  - rehype-expressive-code@0.41.1

## 0.41.0

### Minor Changes

- 380bfcc: Adds new `createInlineSvgUrl` export that creates an inline SVG image data URL from the given contents of an SVG file.

  You can use it to embed SVG images directly into a plugin's styles or HAST, or pass it to an existing `styleOverrides` icon setting.

- 0f33477: Updates Shiki to the latest version (3.2.2).

  This adds support for the strikethrough ANSI control code, updates language grammars and adds the bundled themes `gruvbox-dark-hard`, `gruvbox-dark-medium`, `gruvbox-dark-soft`, `gruvbox-light-hard`, `gruvbox-light-medium`, and `gruvbox-light-soft`.

- 6497f09: Adds new `preventUnitlessValues` property to `PluginStyleSettings`. Thank you @RantingHuman!

  Plugins can set this property to an array of style setting paths to prevent unitless values for specific style settings. If the user passes a unitless value to one of these settings, the engine will automatically add `px` to the value. This is recommended for settings used in CSS calculations which would otherwise break if a unitless value is passed.

- a826a4a: Adds a new `hangingIndent` prop to all code blocks. Thank you @Signum!

  By setting this prop to a positive number of columns (either in the opening code fence, as a prop on the `<Code>` component, or in the `defaultProps` config option), you can now further refine the indentation of wrapped lines.

  If the prop `preserveIndent` is `true` (which is the default), the `hangingIndent` value is added to the indentation of the original line. If `preserveIndent` is `false`, the value is used as the fixed indentation level of all wrapped lines.

  This option only affects how the code block is displayed and does not change the actual code. When copied to the clipboard, the code will still contain the original unwrapped lines.

- 0f33477: Extends ANSI formatting support to allow background colors and strikethrough text. Thank you @dhruvkb!
- 380bfcc: Adds the following new `styleOverrides` settings:

  - `frames.copyIcon`: Allows overriding the SVG icon used for the copy button. Thank you @louisescher!
  - `frames.terminalIcon`: Allows overriding the SVG icon used for the terminal window frame. Defaults to three dots in the top left corner.

- 0f33477: Adds support for `bgColor` and `strikethrough` to `InlineStyleAnnotation`. Thank you @dhruvkb!

### Patch Changes

- Updated dependencies [380bfcc]
- Updated dependencies [0f33477]
- Updated dependencies [6497f09]
- Updated dependencies [a826a4a]
- Updated dependencies [0f33477]
- Updated dependencies [380bfcc]
- Updated dependencies [0f33477]
  - rehype-expressive-code@0.41.0

## 0.40.2

### Patch Changes

- 1734d73: Prevents the default [style reset](https://expressive-code.com/reference/configuration/#usestylereset) from interfering with more complex SVGs inside Expressive Code blocks. Now, not only `path` elements, but all SVGs and their contents are excluded from the reset. Thank you @xt0rted!
- Updated dependencies [1734d73]
  - rehype-expressive-code@0.40.2

## 0.40.1

### Patch Changes

- ecf6ca1: Removes unnecessary end padding from the first code line if the copy to clipboard button is disabled. Thank you @goulvenclech!
- Updated dependencies [ecf6ca1]
  - rehype-expressive-code@0.40.1

## 0.40.0

### Patch Changes

- rehype-expressive-code@0.40.0

## 0.39.0

### Minor Changes

- dc05ddc: Adds new config option `shiki.engine`.

  Allows selecting the Shiki RegExp engine to be used for syntax highlighting. The following options are available:

  - `'oniguruma'`: The default engine that supports all grammars, but requires a target environment with WebAssembly (WASM) support.
  - `'javascript'`: A pure JavaScript engine that does not require WASM. The Shiki team is continuously improving this engine and aims for full compatibility with the Oniguruma engine. Use this engine if your target environment does not support WASM.

- 9149332: Adds new config option `shiki.bundledLangs`.

  Allows defining a subset of language IDs from the full Shiki bundle that should be available for syntax highlighting.

  In server-side rendering (SSR) environments, setting this option to the languages used on your site can reduce bundle size by up to 80%.

  If this option is not set, all languages from the full Shiki bundle are available.

- dc05ddc: Adds new config option `removeUnusedThemes`.

  In Astro and Starlight, Expressive Code now automatically removes any themes from the bundle that are not used by your `themes` configuration. This reduces the SSR bundle size by over 1 MB.

  This new optimization is enabled by default and does not need to be configured for most sites. If you have an advanced use case that requires access all bundled themes, you can set this option to `false`.

- dc05ddc: Adds new config option `shiki.langAlias`.

  Allows defining alias names for languages. The keys are the alias names, and the values are the language IDs to which they should resolve.

  The values can either be bundled languages, or additional languages defined in `shiki.langs`.

  For example, setting `langAlias: { mjs: 'javascript' }` allows using `mjs` in your code blocks as an alias for the `javascript` language.

- 9149332: Updates Shiki to the latest version (1.26.1).

### Patch Changes

- Updated dependencies [9149332]
  - rehype-expressive-code@0.39.0

## 0.38.3

### Patch Changes

- 90b614e: Makes the types used by the `shiki.langs` config option less strict to align them better with actual grammars found in the wild. This attempts to reduce the amount of type errors that occurred before when using external grammars, while still being supported by the language processing code.
- Updated dependencies [90b614e]
  - rehype-expressive-code@0.38.3

## 0.38.2

### Patch Changes

- 480361a: Fixes an issue where the optional `getBlockLocale` callback function was not called when using the `<Code>` component. Thank you @HiDeoo!

  As the parent document's source file path is not available from an Astro component, the `file` property passed to the `getBlockLocale` callback function now contains an additional `url` property that will be set to the value of `Astro.url` in this case.

  When determining the locale of a code block, it is recommended to use this new property first, and only fall back to the existing `path` and `cwd` properties if `url` is undefined.

- 480361a: Fixes an issue where the `tabWidth` setting was not applied when using the `<Code>` component. Thank you @mrchantey!
- Updated dependencies [480361a]
  - rehype-expressive-code@0.38.2

## 0.38.1

### Patch Changes

- rehype-expressive-code@0.38.1

## 0.38.0

### Minor Changes

- 944dda0: Updates Shiki to the latest version (1.22.2).
- b6638f9: Adds config merging functionality to `astro-expressive-code`, which allows using `ec.config.mjs` together with other configuration sources like the Astro / Starlight config or Starlight themes.

  Options defined in `ec.config.mjs` have the highest priority and will override any corresponding values coming from other configuration sources.

  For the following object options, a deep merge is performed instead of a simple override:

  - `defaultProps`
  - `frames`
  - `shiki`
  - `styleOverrides`

  The following array options are concatenated instead of being replaced:

  - `shiki.langs`

### Patch Changes

- Updated dependencies [944dda0]
  - rehype-expressive-code@0.38.0

## 0.37.1

### Patch Changes

- rehype-expressive-code@0.37.1

## 0.37.0

### Minor Changes

- f07fc81: Updates peer dependency range to support Astro 5.

### Patch Changes

- rehype-expressive-code@0.37.0

## 0.36.1

### Patch Changes

- 370a236: Fixes type incompatibility with Astro v4.15. Thank you @delucis!
  - rehype-expressive-code@0.36.1

## 0.36.0

### Minor Changes

- bff1106: Adds the experimental `transformers` option to the Shiki plugin. Thank you @MichaelMakesGames!

  This option allows you to specify a list of Shiki transformers to be called during syntax highlighting.

  **Important:** This option is marked as experimental because it only supports a **very limited subset** of Shiki transformer features right now. Most importantly, transformers cannot modify a code block's text contents in any way, so most popular transformers will not work.

  In its current state, this option allows you to use transformers that solely modify the tokens produced by Shiki to improve syntax highlighting, e.g. applying bracket matching or changing the color of certain tokens.

  Attempting to pass incompatible transformers to this option will throw an error. This is not a bug, neither in Expressive Code, nor in Shiki or the transformers. Please do not report incompatibilities to other authors, as they are unable to fix them. The current limitations exist because the Shiki transformer API is incompatible with Expressive Code's architecture, and we will continue to work on closing the gap and improving this feature.

- ca54f6e: Updates Shiki dependency to the latest version.

### Patch Changes

- Updated dependencies [bff1106]
- Updated dependencies [ca54f6e]
  - rehype-expressive-code@0.36.0

## 0.35.6

### Patch Changes

- ffab5a5: Hides the copy code button in case JavaScript is disabled. Thank you @imkunet!
- Updated dependencies [ffab5a5]
  - rehype-expressive-code@0.35.6

## 0.35.5

### Patch Changes

- 7f9b29e: Fixes a Vite warning about `emitFile()` usage. Thank you @evadecker and @alexanderniebuhr!

  To avoid this warning from being incorrectly triggered, the Vite plugin internally used by `astro-expressive-code` has now been split into two separate plugins, making sure that `emitFile` is only seen by Vite during build.

  - rehype-expressive-code@0.35.5

## 0.35.4

### Patch Changes

- 876d24c: Improves performance of client script managing `tabindex` on code samples. Thanks @delucis!
- Updated dependencies [876d24c]
  - rehype-expressive-code@0.35.4

## 0.35.3

### Patch Changes

- rehype-expressive-code@0.35.3

## 0.35.2

### Patch Changes

- dd54846: Fixes text marker labels including special characters like `\` by properly escaping CSS variable contents. Thank you @stancl!
- Updated dependencies [dd54846]
  - rehype-expressive-code@0.35.2

## 0.35.1

### Patch Changes

- Updated dependencies [389c098]
  - rehype-expressive-code@0.35.1

## 0.35.0

### Minor Changes

- 1875948: Adds the new package `rehype-expressive-code` as the successor to `remark-expressive-code`, which is now considered deprecated.

  If you're using the Astro integration `astro-expressive-code`, you will be automatically using the new package and don't need to do anything.

  If your project has a dependency on `remark-expressive-code`, you should replace it with `rehype-expressive-code` and pass it as a rehype plugin instead of a remark plugin. See the [installation instructions](https://expressive-code.com/installation/#nextjs) for an example.

  The new package includes performance improvements and also works with the latest versions of MDX in popular site generators.

### Patch Changes

- Updated dependencies [1875948]
  - rehype-expressive-code@0.35.0

## 0.34.2

### Patch Changes

- remark-expressive-code@0.34.2

## 0.34.1

### Patch Changes

- 1b2279f: Fixes a11y property `tabindex="0"` being set on non-scrollable code blocks.

  Instead of always adding `tabindex="0"` to the `<pre>` element of code blocks, a small JS module is now used to conditionally add the property to scrollable code blocks only. This ensures that scrollable regions can be accessed via keyboard navigation while avoiding audit warnings about `tabindex` being used on non-scrollable elements.

- Updated dependencies [1b2279f]
  - remark-expressive-code@0.34.1

## 0.34.0

### Minor Changes

- af2a10a: Merges JS modules into a single JS file asset to reduce the number of requests if multiple plugins add JS code.

- b94a91d: Updates dependencies `hast`, `hastscript` and `hast-util-*` to the latest versions.

  **Potentially breaking change:** Unfortunately, some of the new `hast` types are incompatible with their old versions. If you created custom plugins to manipulate HAST nodes, you may need to update your dependencies as well and probably change some types. For example, if you were using the `Parent` type before, you will probably need to replace it with `Parents` or `Element` in the new version.

- b94a91d: Adds a new `/hast` entrypoint to `@expressive-code/core`, `expressive-code`, `remark-expressive-code` and `astro-expressive-code` to simplify plugin development.

  This new entrypoint provides direct access to the correct versions of HAST types and commonly used tree traversal, querying and manipulation functions. Instead of having to add your own dependencies on libraries like `hastscript`, `hast-util-select` or `unist-util-visit` to your project and manually keeping them in sync with the versions used by Expressive Code, you can now import the internally used functions and types directly from this new entrypoint.

- af2a10a: Improves plugin development experience by automatically restarting the dev server if any files imported into `ec.config.mjs` are changed.

  Before this update, only changes to `ec.config.mjs` itself were detected, so plugin development had to be done inside the config file if you wanted to see your changes reflected live in the dev server. Now, you can also develop your plugins in separate files and get the same experience.

  Note: As this feature relies on Vite's module dependency graph, it currently only works if there is at least a single `<Code>` component on the page (which uses imports handled by Vite).

- b94a91d: Ensures that static assets (styles and JS modules) are prerendered when using SSR adapters. Thank you @alexanderniebuhr!

  To achieve this, the previous approach of using `injectRoute` was dropped and the assets are now being handled by the Vite plugin.

- b94a91d: Makes `astro-expressive-code` compatible with SSR adapters.

  To achieve this, the code responsible for loading the optional `ec.config.mjs` file was replaced with a new version that no longer requires any Node.js-specific functionality.

- 2ef2503: Makes Expressive Code compatible with Bun. Thank you @tylergannon for the fix and @richardguerre for the report!

  This fixes the error `msg.match is not a function` that was thrown when trying to use Expressive Code with Bun.

  Additionally, the `type` modifier was added to some imports and exports to fix further Bun issues with plugins and integrations found during testing.

### Patch Changes

- af2a10a: Fixes types of `PartialAstroConfig` to match `AstroConfig` types.
- Updated dependencies [b94a91d]
- Updated dependencies [b6e7167]
  - remark-expressive-code@0.34.0

## 0.33.5

### Patch Changes

- ccbc264: Updates handling of Astro config option `build.assetsPrefix` to support new file extension-based alternatives added in Astro 4.5.0.
- 2469749: Improves word wrap behavior on very narrow screens and when using larger font sizes by allowing wrapping to start at column 20 instead of 30.
- acd3266: Adds `prerender: true` flag to injected asset routes to enable hybrid rendering once it's also supported for `.ts` entrypoints by Astro.
- Updated dependencies [2469749]
  - remark-expressive-code@0.33.5

## 0.33.4

### Patch Changes

- remark-expressive-code@0.33.4

## 0.33.3

### Patch Changes

- f15b9f4: Reverts language loading of `plugin-shiki` to the previous behavior to work around an apparent race condition.
- Updated dependencies [f15b9f4]
  - remark-expressive-code@0.33.3

## 0.33.2

### Patch Changes

- a408e31: Improves error logging in case any plugin hooks fail.
  - remark-expressive-code@0.33.2

## 0.33.1

### Patch Changes

- f3ac898: Fixes an issue where lines containing a very long word after the initial indentation would wrap incorrectly.
- Updated dependencies [f3ac898]
  - remark-expressive-code@0.33.1

## 0.33.0

### Minor Changes

- b7a0607: Adds word wrap support to all Expressive Code blocks.

  By setting the new `wrap` prop to `true` (either in the opening code fence, as a prop on the `<Code>` component, or in the `defaultProps` config option), word wrapping will be enabled, causing lines that exceed the available width to wrap to the next line. The default value of `false` will instead cause a horizontal scrollbar to appear in such cases.

  The word wrap behavior can be further customized using the new `preserveIndent` prop. If `true` (which is the default), wrapped parts of long lines will be aligned with their line's indentation level, making the wrapped code appear to start at the same column. This increases readability of the wrapped code and can be especially useful for languages where indentation is significant, e.g. Python.

  If you prefer wrapped parts of long lines to always start at column 1, you can set `preserveIndent` to `false`. This can be useful to reproduce terminal output.

- b7a0607: Adds a new gutter API that allows plugins to render gutter elements before code lines.

  Using the new `addGutterElement` API accessible through the hook context argument, plugins can add gutter elements to a code block. The function expects an object matching the new `GutterElement` interface.

  During rendering, the engine calls the `renderLine` function of the gutter elements registered by all plugins for every line of the code block. The returned elements are then added as children to the line's gutter container.

  **Potentially breaking change:** To properly support all combinations of gutter elements and line wrapping, the rendered HTML tree of code blocks had to be changed. The code contents of each line are now wrapped inside an extra `<div class="code">...</div>` element:

  ```diff lang="html"
    <div class="ec-line">
  +   <div class="code">
        <span style="...">contents</span>
        [...more contents...]
  +   </div>
    </div>
  ```

  If gutter elements were added to a code block, an optional `<div class="gutter">...</div>` will be rendered before this new code wrapper:

  ```diff lang="html"
    <div class="ec-line">
  +   <div class="gutter">
  +     [...gutter elements...]
  +   </div>
      <div class="code">
        <span style="...">contents</span>
        [...more contents...]
      </div>
    </div>
  ```

- b7a0607: Adds `ExpressiveCodeBlock.props` property and `defaultProps` config option.

  The underlying `ExpressiveCodeBlockProps` interface provides a type-safe way for plugins to extend Expressive Code with their own props using declaration merging. Plugins should use the `preprocessMetadata` hook to merge options specified in the opening code fence into their props, making `props` the single source of truth for all per-block options.

  In addition, the new `defaultProps` config option allows you to specify default props that will automatically be set on all fenced code blocks and `<Code>` components by the engine. This saves you from having to specify the same props on every block, while still allowing to override them on an individual basis.

  The `defaultProps` option also supports an `overridesByLang` property, which allows to override the default props for a specific syntax higlighting language.

- b7a0607: Adds `metaOptions` read-only property to `ExpressiveCodeBlock` instances.

  This new property contains a parsed version of the code block's `meta` string. This allows plugins to easily access the options specified by users in the opening code fence of a code block, without having to parse the `meta` string themselves.

  All official plugins now use this new API to merge any meta options into the new extensible `ExpressiveCodeBlock.props` property.

- b7a0607: Migrates syntax highlighting back to Shiki.

  After the improvements made in Shikiji were merged back into Shiki, Expressive Code now uses Shiki again for syntax highlighting.

  **Potentially breaking:** Although we performed a lot of testing, the migration might cause slightly different highlighting in some cases, as the latest full bundle of Shiki includes various new and updated grammars. We recommend checking if syntax highlighting still looks as expected on your site.

### Patch Changes

- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
- Updated dependencies [b7a0607]
  - remark-expressive-code@0.33.0

## 0.32.4

### Patch Changes

- 20e900a: Improves automatic color contrast correction when using CSS variables in styleOverrides. Thanks @heycassidy!

  It is now possible to use CSS variables in the `styleOverrides` setting `codeBackground` without negatively affecting the automatic color contrast correction controlled by the `minSyntaxHighlightingColorContrast` setting. If a CSS variable is encountered that cannot be resolved to a color value on the server, Expressive Code now automatically uses the theme's background color as a fallback for color contrast calculations. You can also provide your own fallback color using the CSS variable fallback syntax, e.g. `var(--gray-50, #f9fafb)`.

- Updated dependencies [20e900a]
  - remark-expressive-code@0.32.4

## 0.32.3

### Patch Changes

- bc6683b: Improves error messages in case an `ec.config.mjs` file was found, but could not be loaded.
  - remark-expressive-code@0.32.3

## 0.32.2

### Patch Changes

- 062b158: Fixes a race condition with missing styles when multiple `<Code>` components are rendered on the same page.
  - remark-expressive-code@0.32.2

## 0.32.1

### Patch Changes

- b2cf5cf: Fixes virtual API module not resolving without direct package dependency.
  - remark-expressive-code@0.32.1

## 0.32.0

### Minor Changes

- e807f1f: Adds a `<Code>` component that can be used to render code blocks with dynamic contents.

  In addition to rendering fenced code blocks in markdown & MDX documents, the Expressive Code Astro integration now also provides a `<Code>` component that can be used from `.astro` and `.mdx` pages.

  The `<Code>` component provides props like `code`, `lang` or `meta` that allow you to dynamically define a code block's contents. Using this component, you can render code blocks from variables or data coming from external sources like files, databases or APIs.

### Patch Changes

- remark-expressive-code@0.32.0

## 0.31.0

### Minor Changes

- 60eb02a: It is now possible to add text labels to marked lines. Thanks @bdenham!

  The label text is rendered inside a colorful box in the first line of the marked range. This allows you to reference specific parts of your code in the surrounding text.

  To add any text as a label, enclose it in single or double quotes and add it directly after the opening curly brace, followed by a colon (`:`). For example, `ins={"A":6-10}` would mark lines 6 to 10 as inserted and add the label `A` to them.

### Patch Changes

- Updated dependencies [60eb02a]
  - remark-expressive-code@0.31.0

## 0.30.2

### Patch Changes

- a9bbb5c: Fixes missing CSS output for `uiFontWeight` and `codeFontWeight` style settings. Changed font weights are now properly respected. Thank you @depatchedmode!
- 1a3ae04: Individual code blocks can now be switched to the base theme while an alternate theme is selected on the page level.

  Expressive Code differentiates between your base theme (= the first theme in `themes`) and your alternate themes (= any other entries in `themes`). Previously, as soon as an alternate theme was selected on the page level, e.g. by using `<html data-theme="some-theme-name">`, it wasn't possible to switch individual code blocks to the base theme anymore because of selector specificity issues. This has been resolved and block-level overrides should work as expected now.

- a9bbb5c: Fixes unexpected `InlineStyleAnnotation` behaviors to improve DX for plugin authors.

  - Inline styles now use `:where()` in selectors to reduce specificity and make them easier to override.
  - When applying multiple overlapping inline styles to the same line, render phases are now properly respected and later styles override earlier ones.
  - The `styleVariantIndex` property is no longer required. Inline styles without an index now apply to all style variants.
  - The default `InlineStyleAnnotation` render phase is now `normal`. The previous default setting `earliest` is now explicitly applied by `plugin-shiki` instead. This improves the API while still rendering syntax highlighting in the `earliest` phase to allow other annotations to wrap and modify the highlighted code.

- 1a3ae04: Themes that use transparency in unexpected places (e.g. the `rose-pine` themes) are now displayed correctly.
- Updated dependencies [a9bbb5c]
- Updated dependencies [1a3ae04]
- Updated dependencies [a9bbb5c]
- Updated dependencies [1a3ae04]
  - remark-expressive-code@0.30.2

## 0.30.1

### Patch Changes

- c3758cd: Fixes parallel execution of multiple syntax highlighter creations and tasks.

  The Shiki plugin now ensures that async tasks like creating syntax highlighters, loading themes or languages are never started multiple times in parallel. This improves performance, reduces memory usage and prevents build errors on large sites.

- Updated dependencies [c3758cd]
  - remark-expressive-code@0.30.1

## 0.30.0

### Minor Changes

- 05c6ad8: Potentially breaking: Increases minimum supported Astro version to 3.3.0 (when Astro switched to Shikiji).
- 05c6ad8: Changes the syntax highlighter used by `plugin-shiki` to Shikiji. Adds a `shiki: { langs: [...] }` option for loading custom languages.

  This change should not cause any differences in HTML output as all rendering is done by Expressive Code. The new `langs` option allows registering custom TextMate grammars in JSON form.

### Patch Changes

- Updated dependencies [05c6ad8]
  - remark-expressive-code@0.30.0

## 0.29.4

### Patch Changes

- 765dd00: Unknown code block languages now log a warning and render as plaintext instead of throwing an error.
- 765dd00: Adds the config option `useStyleReset`.

  This option determines if code blocks should be protected against influence from site-wide styles. This protection was always enabled before this release and could not be turned off.

  When enabled, Expressive Code uses the declaration `all: revert` to revert all CSS properties to the values they would have had without any site-wide styles. This ensures the most predictable results out of the box.

  You can now set this to `false` if you want your site-wide styles to influence the code blocks.

- 765dd00: Sets `prerender = true` for injected routes to improve adapter support.
- Updated dependencies [765dd00]
- Updated dependencies [765dd00]
  - remark-expressive-code@0.29.4

## 0.29.3

### Patch Changes

- 0935247: Fixes a warning in Astro 4 due to renamed "entryPoint" property. Adds Astro 4 to allowed peer dependencies.
  - remark-expressive-code@0.29.3

## 0.29.2

### Patch Changes

- e18c69d: Comments like `// ...` are now no longer incorrectly detected as file names. Thanks @kdheepak!
- Updated dependencies [e18c69d]
  - remark-expressive-code@0.29.2

## 0.29.1

### Patch Changes

- ff368fc: Fixes asset URLs when using non-default Astro config options for `base`, `build.assets` or `build.assetsPrefix`.
  - remark-expressive-code@0.29.1

## 0.29.0

### Minor Changes

- 85dbab8: Updates default fonts to match Tailwind CSS.

  The previous set of default fonts could result in very thin character line widths on iOS devices. This is now fixed by using the same widely tested set of fonts that Tailwind CSS uses.

- e020b64: Cleans up frontmatter after file name comment extraction.

  If a file name comment gets extracted from a code block without a `title` attribute, additional cleanup work is now performed on the surrounding lines:

  - If the code block's language supports frontmatter, and the comment was located in a frontmatter block that has now become empty, the empty frontmatter block gets removed.
  - If the line following the removed comment (or removed frontmatter block) is empty, it gets removed as well.

### Patch Changes

- Updated dependencies [85dbab8]
- Updated dependencies [e020b64]
  - remark-expressive-code@0.29.0

## 0.28.2

### Patch Changes

- 8c1bdd7: Uses `import type` in route handlers to avoid potential `APIRoute` warning.
  - remark-expressive-code@0.28.2

## 0.28.1

### Patch Changes

- 3425d97: Adds missing `files` entry to make `emitExternalStylesheet` option work.

  Sadly, this bug didn't occur before actually publishing the package - it worked fine when linking the package locally. Sorry about that!

  - remark-expressive-code@0.28.1

## 0.28.0

### Minor Changes

- 20a2116: Adds `emitExternalStylesheet` option.

  Determines if the styles required to display code blocks should be emitted into a separate CSS file rather than being inlined into the rendered HTML of the first code block per page. The generated URL `_astro/ec.{hash}.css` includes a content hash and can be cached indefinitely by browsers.

  This is recommended for sites containing multiple pages with code blocks, as it will reduce the overall footprint of the site when navigating between pages.

  **Important**: To actually benefit from caching, please ensure that your hosting provider serves the contents of the `_astro` directory as immutable files with a long cache lifetime, e.g. `Cache-Control: public,max-age=31536000,immutable`.

  Defaults to `true`.

### Patch Changes

- remark-expressive-code@0.28.0

## 0.27.1

### Patch Changes

- remark-expressive-code@0.27.1

## 0.27.0

### Minor Changes

- f19746b: Adds `useDarkModeMediaQuery` config option.

  This new option determines if CSS code is generated that uses a `prefers-color-scheme` media query to automatically switch between light and dark themes based on the user's system preferences.

  Defaults to `true` if your `themes` option is set to one dark and one light theme (which is the default), and `false` otherwise.

- f19746b: Rendering multiple themes no longer generates duplicate CSS and HTML output.

  In previous versions, a full set of CSS styles was generated for each individual theme, and each code block was rendered multiple times to include the HTML for each theme.

  In this version, the CSS output has been changed to a single static set of base styles that uses CSS variables to allow efficient switching between themes.

  Also, the HTML output for code blocks is now generated only once, and theme-dependent styles are applied using CSS variables.

  These changes significantly reduce page size when using multiple themes, especially on pages with many code blocks.

  If you have added CSS code to your site that relies on the old output (e.g. by selectively hiding or showing theme-specific code blocks based on their class name), you will need to update it to work with the new output.

  > **Note**: Before writing new custom CSS, please consider if you can achieve your desired result out of the box now. For example, if your `themes` option contains one dark and one light theme, the `useDarkModeMediaQuery` option will generate a `prefers-color-scheme` media query for you by default.

- f19746b: Adds `minSyntaxHighlightingColorContrast` config option.

  This new option determines if Expressive Code should process the syntax highlighting colors of all themes to ensure an accessible minimum contrast ratio between foreground and background colors.

  Defaults to `5.5`, which ensures a contrast ratio of at least 5.5:1. You can change the desired contrast ratio by providing another value, or turn the feature off by setting this option to `0`.

- f19746b: Config option `textMarkers` can no longer be an object.

  In previous versions, the `textMarkers` config option could be an object containing plugin options. This is no longer supported, as the only option that was available (`styleOverrides`) has been nested into the top-level `styleOverrides` object now.

  ```diff lang="js"
    /** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
    const remarkExpressiveCodeOptions = {
  -   textMarkers: {
  -     styleOverrides: {
  -       markHue: '310',
  -     },
  -   },
  +   styleOverrides: {
  +     textMarkers: {
  +       markHue: '310',
  +     },
  +     // You could override other plugin styles here as well:
  +     // frames: { ... },
  +   },
    },
  ```

- f19746b: Moves all plugin styles into nested sub-objects of top-level config option `styleOverrides`.

  In previous versions, there could be multiple `styleOverrides` scattered through the configuration (one per plugin with configurable style settings). This has been simplified to a single top-level `styleOverrides` object that contains all style overrides.

  Plugins can contribute their own style settings to this object as well by nesting them inside under their plugin name.

  ```diff lang="js"
    /** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
    const remarkExpressiveCodeOptions = {
      frames: {
        showCopyToClipboardButton: false,
  -     styleOverrides: {
  -       shadowColor: '#124',
  -     },
      },
  +   styleOverrides: {
  +     frames: {
  +       shadowColor: '#124',
  +     },
  +     // You could override other plugin styles here as well:
  +     // textMarkers: { ... },
  +   },
    },
  ```

- f19746b: Renames config option `theme` to `themes`.

  Efficient multi-theme support using CSS variables is now a core feature, so the `theme` option was deprecated in favor of the new array `themes`.

  Please migrate your existing config to use `themes` and ensure it is an array. If you only need a single theme, your `themes` array can contain just this one theme. However, please consider the benefits of providing multiple themes.

  ```diff lang="js"
    /** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
    const remarkExpressiveCodeOptions = {
  -   theme: 'dracula',
  +   // Rename to `themes` and ensure it is an array
  +   // (also consider adding a light theme for accessibility)
  +   themes: ['dracula'],
    },
  ```

- f19746b: Adds `cascadeLayer` config option.

  This new option allows to specify a CSS cascade layer name that should be used for all generated CSS styles.

  If you are using [cascade layers](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Cascade_layers) on your site to control the order in which CSS rules are applied, set this option to a non-empty string, and Expressive Code will wrap all of its generated CSS styles in a `@layer` rule with the given name.

### Patch Changes

- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
- Updated dependencies [f19746b]
  - remark-expressive-code@0.27.0

## 0.26.2

### Patch Changes

- f2e6b81: Fixes multiple different inline marker types on the same line. Thanks @7c78!

  The logic inside `flattenInlineMarkerRanges` had a flaw that caused various combinations of `mark`, `ins` and `del` inline markers on the same line to fail. This was fixed and more tests were added.

- Updated dependencies [f2e6b81]
  - remark-expressive-code@0.26.2

## 0.26.1

### Patch Changes

- 3e0e8c4: Re-initialize copy to clipboard buttons after Astro view transitions.
  - remark-expressive-code@0.26.1

## 0.26.0

### Minor Changes

- d2277ba: Themed selection now keeps the code foreground color intact (like VS Code).

  Color overlays no longer prevent text from being selectable.

### Patch Changes

- Updated dependencies [d2277ba]
  - remark-expressive-code@0.26.0

## 0.25.0

### Minor Changes

- 126563e: Improves theme loading by allowing to pass more theme types directly.

  The `theme` config option now supports the following value types:

  - any theme object compatible with VS Code or Shiki (e.g. imported from an NPM theme package)
  - any ExpressiveCodeTheme instance (e.g. using `ExpressiveCodeTheme.fromJSONString(...)`
    to load a custom JSON/JSONC theme file yourself)
  - if you are using a higher-level integration like `remark-expressive-code` or `astro-expressive-code`:
    - any theme name bundled with Shiki (e.g. `dracula`)
  - any combination of the above in an array

- 126563e: Adds more colors to `ExpressiveCodeTheme.applyHueAndChromaAdjustments`, allows chaining.

  The `applyHueAndChromaAdjustments()` function now also adjusts `titleBar.activeBackground` and `titleBar.border` properly. Also, it returns the `ExpressiveCodeTheme` instance to allow chaining.

### Patch Changes

- Updated dependencies [126563e]
- Updated dependencies [126563e]
  - remark-expressive-code@0.25.0

## 0.24.0

### Minor Changes

- af3171b: Renders frame borders on top of background, adds `editorActiveTabHighlightHeight` style setting.

  Previously, borders were rendered around the editor / terminal window, which could lead to unwanted empty margins between the window background and the drop shadow (e.g. in theme `nord`). Now, the border is rendered on top of the background to resolve this issue, making fully transparent borders act like padding instead.

  Additionally, the `editorActiveTabHighlightHeight` style setting was introduced, which allows customizing the colorful line that highlights the active editor tab. It defaults to `borderWidth`.

### Patch Changes

- af3171b: Passes global `styleOverrides` to plugin style resolver functions.

  This allows plugins to access their individual `styleOverrides` extensions even when values were defined at the global config level.

- Updated dependencies [af3171b]
- Updated dependencies [af3171b]
  - remark-expressive-code@0.24.0

## 0.23.0

### Minor Changes

- bfed62a: Adds config option `customizeTheme`.

  This optional function is called once per theme during engine initialization with the loaded theme as its only argument.

  It allows customizing the loaded theme and can be used for various purposes:

  - You can change a theme's `name` property to influence its generated CSS class name (e.g. `theme.name = 'dark'` will result in code blocks having the class `ec-theme-dark`).
  - You can create color variations of themes by using `theme.applyHueAndChromaAdjustments()`.

- bfed62a: Adds plugin styles to the `styleOverrides` config option.

  So far, this object only contained core styles like colors, fonts, paddings and more. Now, plugins also contribute their own style settings to this object.

  For example, if the `frames` plugin is installed, you can now override its `shadowColor` by setting `styleOverrides.frames.shadowColor` to a color value.

- bfed62a: Adds `applyHueAndChromaAdjustments` function to `ExpressiveCodeTheme`.

  You can now apply chromatic adjustments to entire groups of theme colors while keeping their relative lightness and alpha components intact. This can be used to quickly create theme variants that fit the color scheme of any website or brand.

  Adjustments can either be defined as hue and chroma values in the OKLCH color space (range 0–360 for hue, 0–0.4 for chroma), or these values can be extracted from hex color strings (e.g. `#3b82f6`).

  You can target predefined groups of theme colors (e.g. `backgrounds`, `accents`) and/or use the `custom` property to define your own groups of theme colors to be adjusted.

- bfed62a: Adds outer wrapper when rendering multiple themes.

  When the `theme` option is set to an array containing multiple themes, the rendered code block groups are now wrapped inside `<div class="ec-themes-wrapper">...</div>`. This encapsulates all rendered themes in a single element and thereby ensures their consistent positioning on sites that would otherwise add margins between them due to adjacent sibling combinators.

- bfed62a: Adds `styleOverrides` to `ExpressiveCodeTheme`.

  Themes can now provide their own `styleOverrides`, which take precedence over global `styleOverrides` and the default styles.

### Patch Changes

- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
- Updated dependencies [bfed62a]
  - remark-expressive-code@0.23.0

## 0.22.2

### Patch Changes

- remark-expressive-code@0.22.2

## 0.22.1

### Patch Changes

- remark-expressive-code@0.22.1

## 0.22.0

### Patch Changes

- remark-expressive-code@0.22.0

## 0.21.0

### Minor Changes

- becc145: Adds multi-theme support to the `theme` config option.

  You can now pass an array of themes to the `theme` config option of `remark-expressive-code` and `astro-expressive-code`.

  This allows you to render each code block in your markdown/MDX documents using multiple themes, e.g. to support light and dark modes on your site.

  **Note**: If you use this feature, you will also need to add custom CSS code to your site to ensure that only one theme is visible at any time.

  To allow targeting all code blocks of a given theme through CSS, the theme property `name` is used to generate kebap-cased class names in the format `ec-theme-${name}`. For example, `theme: ['monokai', 'slack-ochin']` will render every code block twice, once with the class `ec-theme-monokai`, and once with `ec-theme-slack-ochin`.

### Patch Changes

- Updated dependencies [becc145]
  - remark-expressive-code@0.21.0

## 0.20.0

### Minor Changes

- 7c5c3c7: Adds `removeCommentsWhenCopyingTerminalFrames` config option to `plugin-frames`. Thanks @AkashRajpurohit!

  If `true` (which is the default), the "Copy to clipboard" button of terminal window frames will remove comment lines starting with `#` from the copied text.

  This is useful to reduce the copied text to the actual commands users need to run, instead of also copying explanatory comments or instructions.

### Patch Changes

- Updated dependencies [7c5c3c7]
  - remark-expressive-code@0.20.0

## 0.19.2

### Patch Changes

- f39ac56: Adds support for Astro 3.0.0 incl. prereleases.
  - remark-expressive-code@0.19.2

## 0.19.1

### Patch Changes

- remark-expressive-code@0.19.1

## 0.19.0

### Minor Changes

- f95d3f1: Adds support for `diff`-like syntax and `lang` meta attribute. Thanks for the idea @hirasso!

  To mark lines as inserted or deleted, you can now use the widely supported `diff` language as an alternative to adding line numbers to the opening code fence.

  You can even specify a separate syntax highlighting language by adding a `lang="..."` attribute to the opening fence. See [README.md](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-text-markers/README.md) for more details.

### Patch Changes

- Updated dependencies [f95d3f1]
  - remark-expressive-code@0.19.0

## 0.18.1

### Patch Changes

- remark-expressive-code@0.18.1

## 0.18.0

### Minor Changes

- 4e26180: Adds support for ANSI formatted code blocks. Thanks @fflaten!

  You can now use the new language `ansi` to render code blocks containing ANSI escape sequences. This allows you to render colorful terminal output.

### Patch Changes

- Updated dependencies [4e26180]
  - remark-expressive-code@0.18.0

## 0.17.0

### Patch Changes

- remark-expressive-code@0.17.0

## 0.16.0

### Minor Changes

- 07012f7: Improves file type support when extracting file names from comments. Thanks @fflaten!

  - Adds more file types to the `LanguageGroups` object
  - Exports `LanguageGroups` to allow external modification
  - Extends automatic detection of frame type to differentiate between shell scripts and terminal sessions based on file name and/or shebang (if any)

### Patch Changes

- Updated dependencies [07012f7]
  - remark-expressive-code@0.16.0

## 0.15.0

### Minor Changes

- Synchronizes package versions to prevent future dependency issues.

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.15.0

## 0.14.0

### Minor Changes

- aa8f09d: Adds support to override frame types per code block. Thanks @Princesseuh!

  By default, the plugin will automatically select the frame type (code editor or terminal) based on the language identifier in your code block's opening fence.

  You can override this behavior and force a specific frame type by adding an optional `frame="..."` attribute after the language identifier.

  The supported values for this attribute are `code`, `terminal`, `none` and `auto`. The default value is `auto`.

### Patch Changes

- Updated dependencies [aa8f09d]
  - remark-expressive-code@0.14.0

## 0.13.0

### Minor Changes

- f98937c: Adds config options `useThemedScrollbars` and `useThemedSelectionColors`. Thanks @Princesseuh!

  Both options default to `true`. Set any of them to `false` to prevent themes from customizing their appearance and render them using the browser's default style.

### Patch Changes

- Updated dependencies [f98937c]
  - remark-expressive-code@0.13.0

## 0.12.2

### Patch Changes

- 66de505: Fixes non-working copy buttons in dynamically loaded content.
- Updated dependencies [66de505]
  - remark-expressive-code@0.12.2

## 0.12.1

### Patch Changes

- Makes marked text selectable (#15). Thanks @hirasso!
- Updated dependencies
  - remark-expressive-code@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [e010774]
  - remark-expressive-code@0.12.0

## 0.11.0

### Minor Changes

- 599db8a: Adds default export for `astro add` support.

### Patch Changes

- remark-expressive-code@0.11.0

## 0.10.0

### Minor Changes

- 5da8685: Adds RTL support (ensure that code lines are always LTR).

### Patch Changes

- Updated dependencies [5da8685]
  - remark-expressive-code@0.10.0

## 0.9.1

### Patch Changes

- Enables stricter TypeScript checks (exactOptionalPropertyTypes), improves types.
- Updated dependencies
  - remark-expressive-code@0.9.1

## 0.9.0

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.9.0

## 0.8.4

### Patch Changes

- remark-expressive-code@0.8.4

## 0.8.3

### Patch Changes

- remark-expressive-code@0.8.3

## 0.8.2

### Patch Changes

- remark-expressive-code@0.8.2

## 0.8.1

### Patch Changes

- Makes `astro` peer dependency more tolerant.
  - remark-expressive-code@0.8.1

## 0.8.0

### Minor Changes

- f8ed803: Adds support for localized texts, adds German to frames plugin.

### Patch Changes

- Updated dependencies [f8ed803]
  - remark-expressive-code@0.8.0

## 0.7.0

### Minor Changes

- Introduces the first working version of the Astro integration package `astro-expressive-code`.

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [af207b0]
  - remark-expressive-code@0.6.0

## 0.5.0

### Patch Changes

- remark-expressive-code@0.5.0

## 0.4.2

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.4.2

## 0.4.1

### Patch Changes

- Fixes issues with color transforms.
- Updated dependencies
  - remark-expressive-code@0.4.1

## 0.4.0

### Patch Changes

- Updated dependencies [b6833ef]
  - remark-expressive-code@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.3.0

## 0.2.0

### Minor Changes

- Initial release.

### Patch Changes

- Updated dependencies
  - remark-expressive-code@0.2.0
