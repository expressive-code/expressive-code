# remark-expressive-code [![NPM version](https://img.shields.io/npm/v/remark-expressive-code.svg)](https://www.npmjs.com/package/remark-expressive-code) [![NPM downloads](https://img.shields.io/npm/dm/remark-expressive-code.svg)](https://npmjs.org/package/remark-expressive-code)

## Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Installation](#installation)
- [Adding the plugin to your site](#adding-the-plugin-to-your-site)
  - [Astro example](#astro-example)
  - [Next.js example using `@next/mdx`](#nextjs-example-using-nextmdx)
  - [Plain remark / unified example](#plain-remark--unified-example)
- [Usage in markdown / MDX documents](#usage-in-markdown--mdx-documents)
- [Configuration](#configuration)
  - [`themes`](#themes)
  - [`minSyntaxHighlightingColorContrast`](#minsyntaxhighlightingcolorcontrast)
  - [`useDarkModeMediaQuery`](#usedarkmodemediaquery)
  - [`themeCssRoot`](#themecssroot)
  - [`themeCssSelector`](#themecssselector)
  - [`cascadeLayer`](#cascadelayer)
  - [`customizeTheme`](#customizetheme)
  - [`useThemedScrollbars`](#usethemedscrollbars)
  - [`useThemedSelectionColors`](#usethemedselectioncolors)
  - [`styleOverrides`](#styleoverrides)
  - [`plugins`](#plugins)
  - [`shiki`](#shiki)
  - [`textMarkers`](#textmarkers)
  - [`frames`](#frames)
- [Migrating from earlier versions](#migrating-from-earlier-versions)

## What is this?

This package is a [unified](https://github.com/unifiedjs/unified) ([remark](https://github.com/remarkjs/remark)) plugin to automatically render code blocks in your markdown / MDX documents using Expressive Code.

### About Expressive Code

Expressive Code is an engine for presenting source code on the web, aiming to make your code easy to understand and visually stunning.

On top of accurate syntax highlighting powered by the same engine as VS Code, Expressive Code allows you to annotate code blocks using text markers, diff highlighting, code editor & terminal window frames, and more.

All annotations are based on a powerful plugin architecture that allows you to extend the functionality of Expressive Code with your own custom annotations.

Expressive Code doesn't depend on any client-side framework, is built with performance in mind and designed to be as lightweight as possible.

No matter if you’re writing a blog, guide, or a full documentation website, Expressive Code will help you make your code examples stand out.

## When should I use this?

When you're using markdown / MDX and want to improve the design and functionality of all contained code blocks using Expressive Code.

## Installation

Use your package manager to install `remark-expressive-code`:

```bash
npm install remark-expressive-code
```

## Adding the plugin to your site

Now that `remark-expressive-code` is installed, add the plugin to your site's configuration.

You can see some examples for popular site generators below. If your site generator is not listed, please refer to its documentation on how to add remark plugins.

### Astro example

We recommend using our dedicated Astro integration instead: [`astro-expressive-code`](https://www.npmjs.com/package/astro-expressive-code)

### Next.js example using `@next/mdx`

```js
// next.config.mjs
import createMDX from '@next/mdx'
import remarkExpressiveCode from 'remark-expressive-code'

/** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
const remarkExpressiveCodeOptions = {
  // You can add configuration options here,
  // see the API section for more information
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
}

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      // The nested array structure below is used
      // to pass options to the remark plugin
      [remarkExpressiveCode, remarkExpressiveCodeOptions],
    ],
    rehypePlugins: [],
  },
})

export default withMDX(nextConfig)
```

### Plain remark / unified example

If you're using remark / unified directly, you can add the plugin like this:

```js
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkExpressiveCode from 'remark-expressive-code'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'

const markdownExample = `
# Hello world

\`\`\`js title="hello-world.js" ins={1}
console.log('Hello world')
\`\`\`
`

main()

async function main() {
  const file = await unified()
    .use(remarkParse)
    .use(remarkDirective)
    // Here we add the plugin to the remark pipeline
    // (you can also pass options as a second argument)
    .use(remarkExpressiveCode)
    // As remark-expressive-code generates HTML nodes,
    // we need to pass `allowDangerousHtml: true`
    // to prevent remark-rehype from dropping them
    .use(remarkRehype, { allowDangerousHtml: true })
    // We also need `rehype-raw` to prevent HTML tags
    // inside the output from being escaped
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(markdownExample)

  console.log(String(file))
}
```

## Usage in markdown / MDX documents

After you've added the plugin to your site, it will automatically render all code blocks in your markdown / MDX documents. You now have access to a range of features described below.

### Default features

#### Syntax highlighting using Shiki

To enable syntax highlighting, ensure that your code blocks are wrapped in code fences (using three or more backticks), and that your opening code fences have a language identifier, e.g. `js` for JavaScript:

````md
```js
console.log('This code will be syntax highlighted!')
```
````

#### Text markers

To add text markers to your code, you can add instructions to the **meta information** of your code blocks. This is the string following the language identifier of your opening code fence. The following features are available:

- [Marking entire lines & line ranges](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-text-markers/README.md#marking-entire-lines--line-ranges)
- [Marking individual text inside lines](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-text-markers/README.md#marking-entire-lines--line-ranges)
  - Plaintext search strings
  - Regular expressions
- [Using multiple marker types (`mark`, `ins`, `del`)](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-text-markers/README.md#selecting-marker-types-mark-ins-del)

#### Window frames

Window frames can be rendered around every code block. Depending on the code's language identifier, this frame can look like a code editor (similar to VS Code), or like a terminal window.

Frames can have optional titles, which are either taken from the code block's meta string, or from a file name comment in the first lines of the code.

- [Code editor window frames](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-frames/README.md#code-editor-window-frames)
- [Terminal window frames](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-frames/README.md#terminal-window-frames)
- [Adding titles (open file tab or terminal window title)](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-frames/README.md#adding-titles-open-file-tab-or-terminal-window-title)

#### Example of everything combined

````md
# Markdown example

The following code block will be highlighted as JavaScript,
wrapped in a code editor frame with the file name "example.js",
and the line range 2-4 will be marked:

```js title="example.js" {2-4}
// Example function
function add(a, b) {
  return a + b
}

console.log(add(1, 2))
```
````

### Add your own features

Expressive Code was designed with extensibility in mind. You can add your own features by creating plugins. See the [plugin documentation](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/core/README.md#plugins) for more information.

## Configuration

When [adding the plugin to your site](#adding-the-plugin-to-your-site), you can pass an options object as a second argument. This object allows you to configure Expressive Code.

The following options are available:

### `themes`

- Type: `ThemeObjectOrShikiThemeName[]`
- Default: `['github-dark', 'github-light']`

- The color themes that should be available for your code blocks.

  CSS variables will be generated for all themes, allowing to select the theme to display using CSS. If you specify one dark and one light theme, a `prefers-color-scheme` media query will also be generated by default. You can customize this to match your site's needs through the `useDarkModeMediaQuery` and `themeCssSelector` options.

  The following item types are supported in this array:
  - any theme name bundled with Shiki: `dark-plus`, `dracula-soft`, `dracula`, `github-dark-dimmed`, `github-dark`, `github-light`, `hc_light`, `light-plus`, `material-theme-darker`, `material-theme-lighter`, `material-theme-ocean`, `material-theme-palenight`, `material-theme`, `min-dark`, `min-light`, `monokai`, `nord`, `one-dark-pro`, `poimandres`, `rose-pine-dawn`, `rose-pine-moon`, `rose-pine`, `slack-dark`, `slack-ochin`, `solarized-dark`, `solarized-light`, `vitesse-dark`, `vitesse-light`
  - any theme object compatible with VS Code or Shiki (e.g. imported from an NPM theme package)
  - any ExpressiveCodeTheme instance (e.g. using `ExpressiveCodeTheme.fromJSONString(...)`
    to load a custom JSON/JSONC theme file yourself). See [`ExpressiveCodeTheme`](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/core/README.md#expressivecodetheme) for more information.

### `minSyntaxHighlightingColorContrast`

- Type: `number`
- Default: `5.5`

- Determines if Expressive Code should process the syntax highlighting colors of all themes to ensure an accessible minimum contrast ratio between foreground and background colors.

  The default value of `5.5` ensures a contrast ratio of at least 5.5:1. You can change the desired contrast ratio by providing another value, or turn the feature off by setting this option to `0`.

### `useDarkModeMediaQuery`

- Type: `boolean`
- Default: `true` if your `themes` option is set to one dark and one light theme (which is the default), and `false` otherwise

- Determines if CSS code is generated that uses a `prefers-color-scheme` media query to automatically switch between light and dark themes based on the user's system preferences.

### `themeCssRoot`

- Type: `string`
- Default: `':root'`

- Allows to customize the base selector used to scope theme-dependent CSS styles.

  By default, this selector is `:root`, which ensures that all required CSS variables are globally available.

### `themeCssSelector`

- Type: `((theme: ExpressiveCodeTheme, context: { styleVariants: StyleVariant[] }) => string | false) | false`
- Default:

  ```js
  (theme) => `[data-theme='${theme.name}']`
  ```

- Allows to customize the selectors used to manually switch between multiple themes.

  These selectors are useful if you want to allow your users to choose a theme instead of relying solely on the media query generated by `useDarkModeMediaQuery`.

  You can add a theme selector either to your `<html>` element (which is targeted by the `themeCssRoot` default value of `:root`), and/or any individual code block wrapper.

  For example, when using the default settings, selecting the theme `github-light` for the entire page would look like this:

  ```html
  <html data-theme="github-light">
  ```

  If your site's theme switcher requires a different approach, you can customize the selectors using this option. For example, if you want to use class names instead of a data attribute, you could set this option to a function that returns `.theme-${theme.name}` instead.

  If you want to prevent the generation of theme-specific CSS rules altogether, you can set this to `false` or return it from the function.

### `cascadeLayer`

- Type: `string`
- Default: `''`

- Allows to specify a CSS cascade layer name that should be used for all generated CSS styles.

  If you are using [cascade layers](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Cascade_layers) on your site to control the order in which CSS rules are applied, set this option to a non-empty string, and Expressive Code will wrap all of its generated CSS styles in a `@layer` rule with the given name.

### `customizeTheme`

- Type: `((theme: ExpressiveCodeTheme) => ExpressiveCodeTheme | void)`
- Default: `undefined`

- This optional function is called once per theme during engine initialization with the loaded theme as its only argument.

  It allows customizing the loaded theme and can be used for various purposes:

  - You can change a theme's `name` property to influence the CSS needed to select it (e.g., when using the default settings for `themeCssRoot` and `themeCssSelector`, setting `theme.name = 'dark'` will allow theme selection using `<html data-theme="dark">`).
  - You can create color variations of themes by using `theme.applyHueAndChromaAdjustments()`.

  You can optionally return an `ExpressiveCodeTheme` instance from this function to replace the theme provided in the configuration. This allows you to create a copy of the theme and modify it without affecting the original instance.

### `useThemedScrollbars`

- Type: `boolean`
- Default: `true`

- Whether the themes are allowed to style the scrollbars.

  If set to `false`, scrollbars will be rendered using the browser's default style.

  Note that you can override the individual scrollbar colors defined by the theme using the `styleOverrides` option.

### `useThemedSelectionColors`

- Type: `boolean`
- Default: `false`

- Whether the themes are allowed to style selected text.

  By default, Expressive Code renders selected text in code blocks using the browser's default style to maximize accessibility. If you want your selections to be more colorful, you can set this option to `true` to allow using theme selection colors instead.

  Note that you can override the individual selection colors defined by the theme using the `styleOverrides` option.

### `styleOverrides`

- Type: `StyleOverrides`
- Default: `{}`

- An optional set of style overrides that can be used to customize the appearance of the rendered code blocks without having to write custom CSS.

  The root level of this nested object contains core styles like colors, fonts, paddings and more. Plugins can contribute their own style settings to this object as well. For example, if the `frames` plugin is enabled, you can override its `shadowColor` by setting `styleOverrides.frames.shadowColor` to a color value.

  If any of the settings are not given, default values will be used or derived from the theme.

  > **Note**:
  > If your site uses CSS variables for styling, you can also use these overrides to replace any core style with a CSS variable reference, e.g. `var(--your-css-var)`.

### `defaultLocale`

- Type: `string`
- Default: `en-US`

- The locale that should be used for text content. Defaults to `en-US`.

### `plugins`

- Type: `(ExpressiveCodePlugin | ExpressiveCodePlugin[])[]`
- Default: `[]`

- An optional array of plugins that should be used when rendering code blocks.

  To add a plugin, import its initialization function and call it inside this array.

  If the plugin has any configuration options, you can pass them to the initialization function as an object containing your desired property values.

  If any nested arrays are found inside the `plugins` array, they will be flattened before processing.

### `shiki`

- Type: `PluginShikiOptions | boolean`
- Default: `true`

- Configures the Shiki plugin, which adds syntax highlighting to code blocks.

  This plugin is enabled by default. Set this to `false` to disable it.

  You can also configure the plugin by setting this to an [options object](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-shiki/README.md#available-plugin-options).

### `textMarkers`

- Type: `boolean`
- Default: `true`

- Configures the Text Markers plugin, which allows to highlight lines and inline ranges in code blocks in various styles (e.g. marked, inserted, deleted).

  This plugin is enabled by default. Set this to `false` to disable it.

### `frames`

- Type: `PluginFramesOptions | boolean`
- Default: `true`

- Configures the Frames plugin, which adds an editor or terminal frame around code blocks, including an optional title displayed as a tab or window caption.

  This plugin is enabled by default. Set this to `false` to disable it.

  You can also configure the plugin by setting this to an [options object](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-frames/README.md#available-plugin-options).

## Migrating from earlier versions

### Breaking changes in v0.27.0

#### Config option `theme` has been renamed to `themes`

Efficient multi-theme support using CSS variables is now a core feature, so the `theme` option was deprecated in favor of the new array `themes`.

Please migrate your existing config to use `themes` and ensure it is an array. If you only need a single theme, your `themes` array can contain just this one theme. However, please consider the benefits of providing multiple themes. See the [`themes`](#themes) option for more details.

```diff lang="js"
  /** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
  const remarkExpressiveCodeOptions = {
-   theme: 'dracula',
+   // Rename to `themes` and ensure it is an array
+   // (also consider adding a light theme for accessibility)
+   themes: ['dracula'],
  },
```

#### Config option `styleOverrides` now contains all plugin styles in nested objects

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

#### Config option `textMarkers` can no longer be an object

In previous versions, the `textMarkers` config option could be an object containing plugin options. This is no longer supported, as the only option that was available (`styleOverrides`) has been nested into the top-level `styleOverrides` object now, as explained in the previous section.

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

#### Rendering multiple themes no longer generates duplicate CSS and HTML output

In previous versions, a full set of CSS styles was generated for each individual theme, and each code block was rendered multiple times to include the HTML for each theme.

In this version, the CSS output has been changed to a single static set of base styles that uses CSS variables to allow efficient switching between themes.

Also, the HTML output for code blocks is now generated only once, and theme-dependent styles are applied using CSS variables.

These changes significantly reduce page size when using multiple themes, especially on pages with many code blocks.

If you have added CSS code to your site that relies on the old output (e.g. by selectively hiding or showing theme-specific code blocks based on their class name), you will need to update it to work with the new output.

> **Note**: Before writing new custom CSS, please consider if you can achieve your desired result out of the box now. For example, if your [`themes`](#themes) option contains one dark and one light theme, the [`useDarkModeMediaQuery`](#usedarkmodemediaquery) option will generate a `prefers-color-scheme` media query for you by default.

#### Engine property `configClassName` has been removed

The `configClassName` property was previously used to add a config-dependent class name to the CSS selectors used to style code blocks.

As this property was automatically calculated by hashing the configuration object, it introduced a level of unpredictability, which has now been removed in favor of static base styles.

#### Engine property `themeClassName` has been removed

The `themeClassName` property was previously used to add a theme-dependent class name to code blocks. Its format was `ec-theme-<name>`, where `<name>` was the kebab-cased name of the theme.

As code blocks are now styled using CSS variables instead of generating multiple blocks for all themes and attaching class names to them, this property is no longer needed.
