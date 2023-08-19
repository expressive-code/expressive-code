# Expressive Code

Expressive Code is an engine for presenting source code on the web, aiming to make your code easy to understand and visually stunning.

On top of accurate syntax highlighting powered by the same engine as VS Code, Expressive Code allows you to annotate code blocks using text markers, diff highlighting, code editor & terminal window frames, and more.

All annotations are based on a powerful plugin architecture that allows you to extend the functionality of Expressive Code with your own custom annotations.

Expressive Code doesn't depend on any client-side framework, is built with performance in mind and designed to be as lightweight as possible.

No matter if you’re writing a blog, guide, or a full documentation website, Expressive Code will help you make your code examples stand out.

## Packages

Expressive Code is split into multiple packages, allowing you to include only the functionality you need for your site. Click on any of the packages below to learn more about them:

### High-level integration packages

You will most likely want to install one of these packages to get started with Expressive Code. Pick the one that matches your site's setup:

- [remark-expressive-code](packages/remark-expressive-code/README.md) [![NPM version](https://img.shields.io/npm/v/remark-expressive-code.svg)](https://www.npmjs.com/package/remark-expressive-code) - A remark plugin that processes all code blocks in markdown and MDX files with Expressive Code.
- [astro-expressive-code](packages/astro-expressive-code/README.md) [![NPM version](https://img.shields.io/npm/v/astro-expressive-code.svg)](https://www.npmjs.com/package/astro-expressive-code) - An Astro integration to automatically render code blocks in any markdown / MDX content on your site with Expressive Code.

### Default plugins

These plugins are automatically installed by the high-level integration packages above. You normally don't need to install them manually.

- [@expressive-code/plugin-frames](packages/@expressive-code/plugin-frames/README.md) - Surrounds your code blocks with code editor or terminal window frames, depending on the code's language.
- [@expressive-code/plugin-shiki](packages/@expressive-code/plugin-shiki/README.md) - Adds syntax highlighting to your code blocks, using the same engine as VS Code.
- [@expressive-code/plugin-text-markers](packages/@expressive-code/plugin-text-markers/README.md) - Allows adding text markers to your code blocks, highlighting specific parts of the code or indicating additions or removals.

### Additional plugins

These plugins provide more features that may be useful for your site. You can install them manually if you need them:

- [@expressive-code/plugin-collapsible-sections](packages/@expressive-code/plugin-collapsible-sections/README.md) - Allows marking code sections as collapsed. The lines in collapsed sections will be hidden by default, replaced by a "X collapsed lines" line. When clicked, the collapsed section will be expanded, showing the previously hidden lines.

### Low-level packages for integration authors

These packages are used by the high-level integration packages. You normally don't need to install them directly.

In advanced use cases, e.g. if you want to develop your own integration into a framework that is not supported by Expressive Code yet, you can use these packages to get started:

- [expressive-code](packages/expressive-code/README.md) [![NPM version](https://img.shields.io/npm/v/expressive-code.svg)](https://www.npmjs.com/package/expressive-code) - This bundle package provides convenient access to the Expressive Code core engine and all default plugins.
- [@expressive-code/core](packages/@expressive-code/core/README.md) - The core engine that powers Expressive Code.

## Installation, Configuration & Usage

You will most likely want to install one of our high-level integrations, depending on your site's setup.

Please have a look at the documentation of those packages for more information:

- [remark-expressive-code](packages/remark-expressive-code/README.md)
- [astro-expressive-code](packages/astro-expressive-code/README.md)

## Contributing

We welcome all contributions! Please read our [contributing guide](CONTRIBUTING.md) to learn about our development process and how to propose bugfixes and improvements.
