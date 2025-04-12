export * from './common/annotation'
export * from './common/block'
export * from './common/engine'
export * from './common/gutter'
export * from './common/line'
export * from './common/plugin-data'
export * from './common/plugin-hooks'
export * from './common/plugin-style-settings'
export * from './common/plugin-texts'
export * from './common/plugin'
export * from './common/style-settings'
export * from './common/style-variants'
export * from './common/theme'

export * from './helpers/assets'
export * from './helpers/ast'
export * from './helpers/color-transforms'
export * from './helpers/i18n'
export * from './helpers/meta-options'
export * from './helpers/objects'

import { cssVarReplacements as internalCssVarReplacements } from './internal/css'

/** @deprecated Please pass a `cssVarReplacements` property to the `PluginStyleSettings` constructor instead. */
export const cssVarReplacements = internalCssVarReplacements
