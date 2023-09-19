# @expressive-code/core

## 0.23.0

### Minor Changes

- bfed62a: Add config option `customizeTheme`.

  This optional function is called once per theme during engine initialization with the loaded theme as its only argument.

  It allows customizing the loaded theme and can be used for various purposes:

  - You can change a theme's `name` property to influence its generated CSS class name (e.g. `theme.name = 'dark'` will result in code blocks having the class `ec-theme-dark`).
  - You can create color variations of themes by using `theme.applyHueAndChromaAdjustments()`.

- bfed62a: Add plugin styles to the `styleOverrides` config option.

  So far, this object only contained core styles like colors, fonts, paddings and more. Now, plugins also contribute their own style settings to this object.

  For example, if the `frames` plugin is installed, you can now override its `shadowColor` by setting `styleOverrides.frames.shadowColor` to a color value.

- bfed62a: Add `applyHueAndChromaAdjustments` function to `ExpressiveCodeTheme`.

  You can now apply chromatic adjustments to entire groups of theme colors while keeping their relative lightness and alpha components intact. This can be used to quickly create theme variants that fit the color scheme of any website or brand.

  Adjustments can either be defined as hue and chroma values in the OKLCH color space (range 0–360 for hue, 0–0.4 for chroma), or these values can be extracted from hex color strings (e.g. `#3b82f6`).

  You can target predefined groups of theme colors (e.g. `backgrounds`, `accents`) and/or use the `custom` property to define your own groups of theme colors to be adjusted.

- bfed62a: Add `styleOverrides` to `ExpressiveCodeTheme`.

  Themes can now provide their own `styleOverrides`, which take precedence over global `styleOverrides` and the default styles.

## 0.22.2

## 0.22.1

## 0.22.0

## 0.21.0

### Minor Changes

- becc145: Add multi-theme support to the `theme` config option.

  You can now pass an array of themes to the `theme` config option of `remark-expressive-code` and `astro-expressive-code`.

  This allows you to render each code block in your markdown/MDX documents using multiple themes, e.g. to support light and dark modes on your site.

  **Note**: If you use this feature, you will also need to add custom CSS code to your site to ensure that only one theme is visible at any time.

  To allow targeting all code blocks of a given theme through CSS, the theme property `name` is used to generate kebap-cased class names in the format `ec-theme-${name}`. For example, `theme: ['monokai', 'slack-ochin']` will render every code block twice, once with the class `ec-theme-monokai`, and once with `ec-theme-slack-ochin`.

## 0.20.0

## 0.19.2

## 0.19.1

## 0.19.0

## 0.18.1

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

### Minor Changes

- Synchronize package versions to prevent future dependency issues

## 0.11.0

### Minor Changes

- f98937c: Add config options `useThemedScrollbars` and `useThemedSelectionColors`. Thanks @Princesseuh!

  Both options default to `true`. Set any of them to `false` to prevent themes from customizing their appearance and render them using the browser's default style.

## 0.10.0

### Minor Changes

- 276d221: Reduce potential of unexpected changes through site-wide CSS

## 0.9.0

### Minor Changes

- 5da8685: Add RTL support (ensure that code lines are always LTR)

## 0.8.1

### Patch Changes

- Enable stricter TypeScript checks (exactOptionalPropertyTypes), improve types

## 0.8.0

### Minor Changes

- Improve mobile core and copy button styles

## 0.7.0

### Minor Changes

- Fix CSS inconsistencies due to box-sizing

## 0.6.0

### Minor Changes

- f8ed803: Add support for localized texts, add German to frames plugin

## 0.5.0

### Minor Changes

- af207b0: Allow plugins to add JS modules

## 0.4.0

### Minor Changes

- Automatically trim whitespace at the end of lines, and remove empty lines at the beginning & end of code blocks

## 0.3.1

### Patch Changes

- Fix issues with color transforms

## 0.3.0

### Minor Changes

- 6d316f6: Change base font size unit to rem

## 0.2.1

### Patch Changes

- Remove any padding from pre element

## 0.2.0

### Minor Changes

- Initial release
