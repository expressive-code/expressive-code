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
  - [`theme`](#theme)
  - [`useThemedScrollbars`](#usethemedscrollbars)
  - [`useThemedSelectionColors`](#usethemedselectioncolors)
  - [`styleOverrides`](#styleoverrides)
  - [`plugins`](#plugins)
  - [`shiki`](#shiki)
  - [`textMarkers`](#textmarkers)
  - [`frames`](#frames)

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

### `theme`

- Type: `BundledShikiTheme | ExpressiveCodeTheme | (BundledShikiTheme | ExpressiveCodeTheme)[]`
- Default: `github-dark`

- The color theme that should be used when rendering.

  You can pass the name of any theme bundled with Shiki: `dark-plus`, `dracula-soft`, `dracula`, `github-dark-dimmed`, `github-dark`, `github-light`, `hc_light`, `light-plus`, `material-theme-darker`, `material-theme-lighter`, `material-theme-ocean`, `material-theme-palenight`, `material-theme`, `min-dark`, `min-light`, `monokai`, `nord`, `one-dark-pro`, `poimandres`, `rose-pine-dawn`, `rose-pine-moon`, `rose-pine`, `slack-dark`, `slack-ochin`, `solarized-dark`, `solarized-light`, `vitesse-dark`, `vitesse-light`

  You can also load a custom theme. See [`ExpressiveCodeTheme`](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/core/README.md#expressivecodetheme) for more information.

- **Note**: You can pass an array of themes to this option to render each code block in your markdown/MDX documents using multiple themes. In this case, you will also need to add custom CSS code to your site to ensure that only one theme is visible at any time.

  To allow targeting all code blocks of a given theme through CSS, the theme property `name` is used to generate kebap-cased class names in the format `ec-theme-${name}`. For example, `theme: ['monokai', 'slack-ochin']` will render every code block twice, once with the class `ec-theme-monokai`, and once with `ec-theme-slack-ochin`.

### `useThemedScrollbars`

- Type: `boolean`
- Default: `true`

- Whether the theme is allowed to style the scrollbars.

  If set to `false`, scrollbars will be rendered using the browser's default style.

  Note that you can override the individual scrollbar colors defined by the theme using the `styleOverrides` option.

### `useThemedSelectionColors`

- Type: `boolean`
- Default: `true`

- Whether the theme is allowed to style selected text.

  If set to `false`, selected text will be rendered using the browser's default style.

  Note that you can override the individual selection colors defined by the theme using the `styleOverrides` option.

### `styleOverrides`

- Type: `Partial<UnresolvedCoreStyleSettings<CoreStyleSettings>>`
- Default: `{}`

- An optional set of style overrides that can be used to customize the appearance of the rendered code blocks without having to write custom CSS. You can customize core colors, fonts, paddings and more.

  If any of the settings are not given, default values will be used or derived from the theme, as seen in the exported `coreStyleSettings` object.

  > **Note**:
  > If your site uses CSS variables for styling, you can also use these overrides to replace any core style with a CSS variable reference, e.g. `var(--your-css-var)`.

### `plugins`

- Type: `(ExpressiveCodePlugin | ExpressiveCodePlugin[])[]`
- Default: `[]`

- An optional array of plugins that should be used when rendering code blocks.

  To add a plugin, import its initialization function and call it inside this array.

  If the plugin has any configuration options, you can pass them to the initialization function as an object containing your desired property values.

  If any nested arrays are found inside the `plugins` array, they will be flattened before processing.

### `shiki`

- Type: `boolean`
- Default: `true`

- Configures the Shiki plugin, which adds syntax highlighting to code blocks. You can set this to `false` to disable it.

### `textMarkers`

- Type: `PluginTextMarkersOptions | boolean`
- Default: `true`

- Configures the Text Markers plugin, which allows to highlight lines and inline ranges in code blocks in various styles (e.g. marked, inserted, deleted).

  This plugin is enabled by default. Set this to `false` to disable it.

  You can also configure the plugin by setting this to an [options object](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-text-markers/README.md#available-plugin-options).

### `frames`

- Type: `PluginFramesOptions | boolean`
- Default: `true`

- Configures the Frames plugin, which adds an editor or terminal frame around code blocks, including an optional title displayed as a tab or window caption.

  This plugin is enabled by default. Set this to `false` to disable it.

  You can also configure the plugin by setting this to an [options object](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/plugin-frames/README.md#available-plugin-options).
