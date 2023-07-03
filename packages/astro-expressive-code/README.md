# astro-expressive-code

## Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Installation](#installation)
  - [Automatic installation using the Astro CLI (recommended)](#automatic-installation-using-the-astro-cli-recommended)
  - [Manual installation](#manual-installation)
- [Usage in markdown / MDX documents](#usage-in-markdown--mdx-documents)
- [Configuration](#configuration)
  - [`theme`](#theme)
  - [`styleOverrides`](#styleoverrides)
  - [`plugins`](#plugins)
  - [`shiki`](#shiki)
  - [`textMarkers`](#textmarkers)
  - [`frames`](#frames)

## What is this?

This package is an [Astro](https://astro.build/) integration to automatically render code blocks in any markdown / MDX content on your Astro site using Expressive Code.

### About Expressive Code

Expressive Code is an engine for presenting source code on the web, aiming to make your code easy to understand and visually stunning.

On top of accurate syntax highlighting powered by the same engine as VS Code, Expressive Code allows you to annotate code blocks using text markers, diff highlighting, code editor & terminal window frames, and more.

All annotations are based on a powerful plugin architecture that allows you to extend the functionality of Expressive Code with your own custom annotations.

Expressive Code doesn't depend on any client-side framework, is built with performance in mind and designed to be as lightweight as possible.

No matter if you’re writing a blog, guide, or a full documentation website, Expressive Code will help you make your code examples stand out.

## When should I use this?

When you're writing content for your Astro site in markdown / MDX and want to improve the design and functionality of all contained code blocks using Expressive Code.

## Installation

### Automatic installation using the Astro CLI (recommended)

1. Change into the directory of your Astro site. If you do not have an existing Astro site, first create a new one using `npm create astro@latest` (other package managers like `pnpm` and `yarn` are also supported).

2. Use Astro's CLI to install `astro-expressive-code`:

    ```bash
    # When using npm
    npx astro add astro-expressive-code

    # When using pnpm
    pnpm astro add astro-expressive-code

    # When using yarn
    yarn astro add astro-expressive-code
    ```

    Confirm all prompts to download this third-party integration and add it to your site's configuration.

3. You're done! 🎉

### Manual installation

If you don't want to use the Astro CLI or encounter any issues, you can also install `astro-expressive-code` manually:

1. Add the package to your site's dependencies:

    ```bash
    # When using npm
    npm install astro-expressive-code

    # When using pnpm
    pnpm install astro-expressive-code

    # When using yarn
    yarn add astro-expressive-code
    ```

2. Add the integration to your site's configuration:

    ```js
    // astro.config.mjs
    import { defineConfig } from 'astro/config'
    import astroExpressiveCode from 'astro-expressive-code'

    export default defineConfig({
      integrations: [
        astroExpressiveCode(),
      ],
    })
    ```

3. You're done! 🎉

## Usage in markdown / MDX documents

After you've added the integration to your Astro site, it will automatically render all code blocks in your markdown / MDX documents. You now have access to a range of features described below.

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

In your Astro config file, you can pass an options object to the integration. This object allows you to configure Expressive Code:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import astroExpressiveCode from 'astro-expressive-code'

/** @type {import('astro-expressive-code').AstroExpressiveCodeOptions} */
const astroExpressiveCodeOptions = {
  // Example: Change the theme to "dracula"
  theme: 'dracula',
}

export default defineConfig({
  integrations: [
    astroExpressiveCode(astroExpressiveCodeOptions),
  ],
})
```

The following options are available:

### `theme`

- Type: `BundledShikiTheme | ExpressiveCodeTheme`
- Default: `github-dark`

- The color theme that should be used when rendering.

  You can pass the name of any theme bundled with Shiki: `dark-plus`, `dracula-soft`, `dracula`, `github-dark-dimmed`, `github-dark`, `github-light`, `hc_light`, `light-plus`, `material-theme-darker`, `material-theme-lighter`, `material-theme-ocean`, `material-theme-palenight`, `material-theme`, `min-dark`, `min-light`, `monokai`, `nord`, `one-dark-pro`, `poimandres`, `rose-pine-dawn`, `rose-pine-moon`, `rose-pine`, `slack-dark`, `slack-ochin`, `solarized-dark`, `solarized-light`, `vitesse-dark`, `vitesse-light`

  You can also load a custom theme. See [`ExpressiveCodeTheme`](https://github.com/expressive-code/expressive-code/blob/main/packages/%40expressive-code/core/README.md#expressivecodetheme) for more information.

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
