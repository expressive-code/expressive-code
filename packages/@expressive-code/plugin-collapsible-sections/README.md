# @expressive-code/plugin-collapsible-sections

## Contents

- [@expressive-code/plugin-collapsible-sections](#expressive-codeplugin-collapsible-sections)
  - [Contents](#contents)
  - [What is this?](#what-is-this)
  - [When should I use this?](#when-should-i-use-this)
  - [Installation (not required)](#installation-not-required)
  - [Usage in markdown / MDX documents](#usage-in-markdown--mdx-documents)
  - [Configuration](#configuration)
    - [Astro configuration example](#astro-configuration-example)
    - [Next.js configuration example using `@next/mdx`](#nextjs-configuration-example-using-nextmdx)
    - [Available plugin options](#available-plugin-options)
  - [Advanced use cases](#advanced-use-cases)
    - [Manual installation](#manual-installation)
    - [Manual usage from the core package](#manual-usage-from-the-core-package)

## What is this?

A default plugin of Expressive Code, an engine for presenting source code on the web.

It allows code sections to be marked as collapsed. The lines in collapsed sections will be hidden by default, replaced by a "X collapsed lines" line. When clicked, the collapsed section will be expanded, showing the previously hidden lines.

## When should I use this?

You can use this plugin to cut down long code examples to only their relevant parts, while still allowing users to read the full code if they want to. For more information, see the [usage examples](#usage-in-markdown--mdx-documents) below.

This plugin is **installed by default** by our higher-level packages like `remark-expressive-code`, so you can start using it in markdown / MDX documents without having to install it first.

## Installation (not required)

No installation is required. This package is **installed by default** by our higher-level packages.

If you are using the core package directly (e.g. because you are writing an integration), see the [Advanced use cases](#advanced-use-cases) section for more information.

## Usage in markdown / MDX documents

To mark a section as collapsible, you need to add **meta information** to your code blocks. This is done by appending `collapse={X-Y}` to your opening code fence, indicating a collapsed section from line `X` to (and including) line `Y`:

```js collapse={4-8, 12-15}
//    ^^^^^^^^^^^^^^^^^^^^^^
//    This is the meta information of this code block.
//    It describes 2 collapsed sections, one from line
//    4 to line 8, and one from line 12 to line 15.
```

## Configuration

When using this plugin through higher-level integration packages, you can configure it by passing options to the higher-level package.

Here are configuration examples for some popular site generators:

### Astro configuration example

We assume that you're using our Astro integration [`astro-expressive-code`](https://www.npmjs.com/package/astro-expressive-code).

In your Astro config file, you can pass options to the collapsible sections plugin like this:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import astroExpressiveCode from 'astro-expressive-code'

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
const astroExpressiveCodeOptions = {
  // This is where you can pass your plugin options
  collapsibleSections: {
    styleOverrides: {
      closedBackgroundColor: 'none'
    },
    summary: 'Click to show {count} hidden lines'
  },
}

export default defineConfig({
  integrations: [
    astroExpressiveCode(astroExpressiveCodeOptions),
  ],
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
  collapsibleSections: {
    styleOverrides: {
      styleOverrides: {
        closedBackgroundColor: 'none'
      },
      summary: 'Click to show {count} hidden lines'
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
  - `resolveSetting`: A function that can be used to resolve another style setting. It takes a style property name, and returns its resolved value.

  The following properties are available:

  - Styles applying to the section when collapsed:
    `closedBorderWidth`, `closedBorderColor`, `closedPadding`, `closedMargin`, `closedTextColor`, `closedBackgroundColor`,

  - Styles applying to the section when open:
    `openBorderWidth`, `openBorderColor`, `openPadding`, `openMargin`, `openBackgroundColor`

- `summary`
  
  The text to show when the section is collapsed. Can contain the placeholder string `{count}`, which will be replaced by the number of lines the section contains.

## Advanced use cases

### Manual installation

You only need to install this plugin if you are using the core package `@expressive-code/core` directly. In this case, you can install the plugin like this:

```bash
# Note: This is an advanced usage example!
# You normally don't need to install this package manually,
# it is installed by default by our higher-level packages.
npm install @expressive-code/plugin-collapsible-sections
```

### Manual usage from the core package

> **Warning**:
> **This is an advanced usage example!** You normally don't need to use the core package directly, or manually add this plugin to the configuration.

```js
import { ExpressiveCodeEngine } from '@expressive-code/core'
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'

const ec = new ExpressiveCodeEngine({
  plugins: [
    // Note: If you want to configure the plugin,
    //       you can pass options like this:
    // pluginCollapsibleSections({ ...your options here... })
    pluginCollapsibleSections(),
  ],
})

const code = `
// my-test-file.js
const hello = 'World!'
const foo = 'bar'
`

const renderResult = await ec.render({
  code: code.trim(),
  language: 'js',
  meta: `collapsed={1-2}`
})

// If you were to render the returned AST to HTML now,
// the first two lines would be wrapped in a <details>
```
