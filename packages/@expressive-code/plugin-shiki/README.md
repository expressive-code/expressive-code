# @expressive-code/plugin-shiki

## Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Installation (not required)](#installation-not-required)
- [Usage in markdown / MDX documents](#usage-in-markdown--mdx-documents)
- [Supported languages](#supported-languages)
- [Configuration](#configuration)
  - [Astro configuration example](#astro-configuration-example)
  - [Next.js configuration example using `@next/mdx`](#nextjs-configuration-example-using-nextmdx)
- [Advanced use cases](#advanced-use-cases)
  - [Manual installation](#manual-installation)
  - [Manual usage from the core package](#manual-usage-from-the-core-package)

## What is this?

A default plugin of Expressive Code, an engine for presenting source code on the web.

It performs syntax highlighting of your code blocks using the popular [Shiki](https://shiki.matsu.io/) highlighter, which is also being used by VS Code.

## When should I use this?

This plugin is **installed by default** by our higher-level packages like `remark-expressive-code`, so it will be used automatically when rendering code blocks in your markdown / MDX documents.

## Installation (not required)

No installation is required. This package is **installed by default** by our higher-level packages.

If you are using the core package directly (e.g. because you are writing an integration), see the [Advanced use cases](#advanced-use-cases) section for more information.

## Usage in markdown / MDX documents

This plugin will automatically highlight your code blocks using the current theme of Expressive Code.

You only need to ensure that your opening code fences have a language identifier, e.g. `js` for JavaScript:

````md
```js
console.log('This code will be syntax highlighted!')
```
````

## Supported languages

The full list of languages can be found in the [Shiki documentation](https://github.com/shikijs/shiki/blob/main/docs/languages.md#all-languages).

## Configuration

This plugin does not have any configuration options. It automatically uses the current theme of Expressive Code, which you can select using its `theme` configuration option.

Here are configuration examples on how to select a theme in some popular site generators:

### Astro configuration example

We assume that you're using our Astro integration [`astro-expressive-code`](https://www.npmjs.com/package/astro-expressive-code).

In your Astro config file, you can pass options to the plugin like this:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import astroExpressiveCode from 'astro-expressive-code'

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
const astroExpressiveCodeOptions = {
  // You can set this to any of the themes bundled with Shiki,
  // specify a path to JSON theme file, or pass an instance
  // of the `ExpressiveCodeTheme` class here:
  theme: 'dracula',
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
  // You can set this to any of the themes bundled with Shiki,
  // specify a path to JSON theme file, or pass an instance
  // of the `ExpressiveCodeTheme` class here:
  theme: 'nord',
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

## Advanced use cases

### Manual installation

You only need to install this plugin if you are using the core package `@expressive-code/core` directly. In this case, you can install the plugin like this:

```bash
# Note: This is an advanced usage example!
# You normally don't need to install this package manually,
# it is installed by default by our higher-level packages.
npm install @expressive-code/plugin-shiki
```

### Manual usage from the core package

> **Warning**:
> **This is an advanced usage example!** You normally don't need to use the core package directly, or manually add this plugin to the configuration.

```js
import { ExpressiveCodeEngine } from '@expressive-code/core'
import { pluginShiki } from '@expressive-code/plugin-shiki'

const ec = new ExpressiveCodeEngine({
  plugins: [
    pluginShiki(),
  ],
})

const renderResult = await ec.render({
  code: 'const hello = "World!"',
  language: 'js',
})

// If you were to render the returned AST to HTML now,
// the code would be syntax highlighted.
```
