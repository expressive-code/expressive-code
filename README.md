# Expressive Code

Expressive Code is an engine for presenting source code on the web, aiming to make your code easy to understand and visually stunning.

On top of accurate syntax highlighting powered by the same engine as VS Code, Expressive Code allows you to annotate code blocks using text markers, diff highlighting, code editor & terminal window frames, and more.

All annotations are based on a powerful plugin architecture that allows you to extend the functionality of Expressive Code with your own custom annotations.

Expressive Code doesn't depend on any client-side framework, is built with performance in mind and designed to be as lightweight as possible.

No matter if you’re writing a blog, guide, or a full documentation website, Expressive Code will help you make your code examples stand out.

## Packages

Expressive Code is split into multiple packages, allowing you to include only the functionality you need for your site. Click on any of the packages below to learn more about them:

### Main packages

- [expressive-code](packages/expressive-code/README.md) - The main package that provides convenient access to the Expressive Code engine and all default plugins.
- [remark-expressive-code](packages/remark-expressive-code/README.md) - A remark plugin that processes all code blocks in markdown and MDX files with Expressive Code.

### Internal packages

- [@expressive-code/core](packages/@expressive-code/core/README.md) - The core package that powers Expressive Code.
- [@expressive-code/plugin-frames](packages/@expressive-code/plugin-frames/README.md) - A plugin that surrounds your code blocks with code editor or terminal window frames, depending on the code's language.
- [@expressive-code/plugin-shiki](packages/@expressive-code/plugin-shiki/README.md) - A plugin that adds syntax highlighting to your code blocks, using the same engine as VS Code.
- [@expressive-code/plugin-text-markers](packages/@expressive-code/plugin-text-markers/README.md) - A plugin that allows you to add text markers to your code blocks, highlighting specific parts of the code or indicating additions or removals.

## Installation

Until we've finished developing integrations into popular site generators like Astro (which will be available soon), you'll most likely want to install our remark plugin:

```bash
npm install remark-expressive-code
```

## Usage

You can then import it into the file that contains your site's markdown configuration.

Here's an example of how to do that in an Astro project:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import remarkExpressiveCode from 'remark-expressive-code'

/** @type import('remark-expressive-code').RemarkExpressiveCodeOptions */
const remarkExpressiveCodeOptions = {
	// See below for all available options
	theme: 'dracula',
}

export default defineConfig({
	markdown: {
		remarkPlugins: [[remarkExpressiveCode, remarkExpressiveCodeOptions]],
	},
})
```

## Options

TODO
