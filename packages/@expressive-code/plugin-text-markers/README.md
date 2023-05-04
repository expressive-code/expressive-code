# @expressive-code/plugin-text-markers

## Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Installation (not required)](#installation-not-required)
- [Configuration](#configuration)
  - [Astro configuration example](#astro-configuration-example)
  - [Next.js configuration example using `@next/mdx`](#nextjs-configuration-example-using-nextmdx)
  - [Available plugin options](#available-plugin-options)
- [Usage in markdown / MDX documents](#usage-in-markdown--mdx-documents)
  - [Marking entire lines & line ranges](#marking-entire-lines--line-ranges)
  - [Marking individual text inside lines](#marking-individual-text-inside-lines)
    - [Plaintext search strings](#plaintext-search-strings)
    - [Regular expressions](#regular-expressions)
  - [Selecting marker types (`mark`, `ins`, `del`)](#selecting-marker-types-mark-ins-del)
- [Advanced use cases](#advanced-use-cases)
  - [Manual installation](#manual-installation)
  - [Manual usage from the core package](#manual-usage-from-the-core-package)

## What is this?

A default plugin of Expressive Code, an engine for presenting source code on the web.

It allows you to mark entire lines & line ranges, as well as individual text inside your lines using a selection of marker styles (marked, inserted, deleted).

It also ensures accessible color contrast of the marked code, automatically tweaking the text colors if necessary while keeping syntax highlighting intact.

Please see the [usage examples](#usage-in-markdown--mdx-documents) below for more information.

## When should I use this?

This plugin is **installed by default** by our higher-level packages like `remark-expressive-code`, so text markers are always available when rendering code blocks in your markdown / MDX documents.

## Installation (not required)

No installation is required. This package is **installed by default** by our higher-level packages.

If you are using the core package directly (e.g. because you are writing an integration), see the [Advanced use cases](#advanced-use-cases) section for more information.

## Configuration

When using this plugin through higher-level integration packages, you can configure it by passing options to the higher-level package.

As it's most likely that you are using `remark-expressive-code`, here are configuration examples for some popular site generators:

### Astro configuration example

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import remarkExpressiveCode from 'remark-expressive-code'

/** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
const remarkExpressiveCodeOptions = {
  // This is where you can pass your plugin options
  textMarkers: {
    styleOverrides: {
      // Make default marker color slightly purple
      markHue: '310',
      // Reduce marker border opacity
      borderOpacity: '50%',
    },
  },
}

export default defineConfig({
  markdown: {
    remarkPlugins: [
      // The nested array structure is required to pass options
      // to a remark plugin
      [remarkExpressiveCode, remarkExpressiveCodeOptions],
    ],
  },
})
```

### Next.js configuration example using `@next/mdx`

```js
// next.config.mjs
import createMDX from '@next/mdx'
import remarkExpressiveCode from 'remark-expressive-code'

/** @type {import('remark-expressive-code').RemarkExpressiveCodeOptions} */
const remarkExpressiveCodeOptions = {
  // This is where you can pass your plugin options
  textMarkers: {
    styleOverrides: {
      // Make default marker color slightly purple
      markHue: '310',
      // Reduce marker border opacity
      borderOpacity: '50%',
    },
  },
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
      // The nested array structure is required to pass options
      // to a remark plugin
      [remarkExpressiveCode, remarkExpressiveCodeOptions],
    ],
    rehypePlugins: [],
  },
})

export default withMDX(nextConfig)
```

### Available plugin options

You can pass the following options to the plugin:

- `styleOverrides`

  Allows overriding the plugin's default styles using an object with named properties.

  The property values can either be a string, or a function that returns a string. If a function is used, it will be called with the following arguments:

  - `theme`: An ExpressiveCodeTheme object containing the current theme's colors and other properties.
  - `coreStyles`: An object containing the ExpressiveCodeEngine core styles.
  - `resolveSetting`: A function that can be used to resolve another style setting. It takes a style property name, and returns its resolved value. For example, all marker color values are calculated from base settings like `markHue` using this function.

  The following properties are available:

  - Spacing & border styles:
    `lineMarkerAccentMargin`, `lineMarkerAccentWidth`, `lineDiffIndicatorMarginLeft`, `inlineMarkerBorderWidth`, `inlineMarkerBorderRadius`, `inlineMarkerPadding`,

  - Base color styles for all markers:
    `markHue`, `insHue`, `delHue`, `defaultChroma`, `defaultLuminance`, `backgroundOpacity`, `borderLuminance`, `borderOpacity`, `indicatorLuminance`, `indicatorOpacity`,
    > **Note**: These colors use the LCH color space to ensure that the perceived color contrast is always the same, regardless of the base color hue. As not all browsers support this color space yet, the resulting colors will be converted to RGB before output.

  - Diff indicator settings:
    `insDiffIndicatorContent`, `delDiffIndicatorContent`

  - Individual marker color styles:
    `markBackground`, `markBorderColor`, `insBackground`, `insBorderColor`, `insDiffIndicatorColor`, `delBackground`, `delBorderColor`, `delDiffIndicatorColor`
    > **Note**: By default, these colors are calculated from the base color styles above. You can override them individually if you want to.

## Usage in markdown / MDX documents

To use text markers, you need to add them to the **meta information** of your code blocks. This is the string following the language identifier of your opening code fence:

````md
```js {4, 12-15} "this will be marked" /ye[sp]/
//    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//    This is the meta information of this code
//    block. It contains 3 text markers:
//    - Line range: {4, 12-15}
//    - Plaintext search: "this will be marked"
//    - Regular expression search: /ye[sp]/
```
````

### Marking entire lines & line ranges

Lines can be marked by adding their **line numbers inside curly brackets** to a code block's meta information. Line numbers start at 1, just like in VS Code and other popular editors.

You can either mark a single line, or a range of lines, and you can combine multiple line markers by separating them with commas:

- Single line: `{4}`
- Multiple lines: `{4, 8, 12}`
- Range of lines: `{4-8}`
- Different types combined: `{4, 6, 12-15}`

### Marking individual text inside lines

#### Plaintext search strings

To match a string of text inside your code block's lines, simply **wrap it in quotes**. You can use either double or single quotes:

- `"this will be marked"`
- `'this will be marked'`

If the text you want to match contains quotes itself, you can use the other quote type to wrap it without having to escape the nested quotes:

- `"these 'single' quotes need no escaping"`
- `'these "double" quotes need no escaping'`

If you cannot avoid nested quotes of the same type, you can escape them using a backslash:

- `"this contains both \"double\" and 'single' quotes"`
- `'this contains both "double" and \'single\' quotes'`

#### Regular expressions

To match a regular expression inside your code block's lines, **wrap it in forward slashes**:

- `/ye[sp]/` will mark both `yes` and `yep`

To match a forward slash inside your regular expression, you can escape it using a backslash:

- `/\/home\//` will mark `/home/`

If you only want to mark certain parts matched by your regular expression, you can use capture groups:

- `/ye(s|p)/` will match `yes` and `yep`, but only mark the character `s` or `p`

To prevent capture groups from being marked, you can use non-capturing groups:

- `/ye(?:s|p)/` will mark `yes` and `yep`

### Selecting marker types (`mark`, `ins`, `del`)

All of the above examples will use the default marker type `mark`, unless you specify a different type like `ins` (inserted) or `del` (deleted).

You can add your desired marker type in front of the marker definition, followed by an equals sign. For example, to mark a line as inserted, you would use `ins={4}`.

You can also combine many different markers in a single code block:

````md
```js del={4-6} ins={12} ins="this was inserted" del=/ye[sp]/
//    ^^^^^^^^^ ^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^
//    deleted   inserted        inserted           deleted
//    lines     line            text               text
```
````

## Advanced use cases

### Manual installation

You only need to install this plugin if you are using the core package `@expressive-code/core` directly. In this case, you can install the plugin like this:

```bash
# Note: This is an advanced usage example!
# You normally don't need to install this package manually,
# it is installed by default by our higher-level packages.
npm install @expressive-code/plugin-text-markers
```

### Manual usage from the core package

> **Warning**:
> **This is an advanced usage example!** You normally don't need to use the core package directly, or manually add this plugin to the configuration.

```js
import { ExpressiveCodeEngine } from '@expressive-code/core'
import { pluginTextMarkers } from '@expressive-code/plugin-text-markers'

const ec = new ExpressiveCodeEngine({
  plugins: [
    // Note: If you want to configure the plugin,
    //       you can pass options like this:
    // pluginTextMarkers({ ...your options here... })
    pluginTextMarkers(),
  ],
})

const renderResult = await ec.render({
  code: `const hello = 'World!'`,
  language: 'js',
  meta: `"hello"`,
})

// If you were to render the returned AST to HTML now,
// the word "hello" would be marked.
```
