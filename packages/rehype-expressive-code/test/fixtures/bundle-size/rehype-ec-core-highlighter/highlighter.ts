import type { DynamicImportLanguageRegistration, DynamicImportThemeRegistration, HighlighterGeneric } from 'shiki'
import { createSingletonShorthands, createdBundledHighlighter, createJavaScriptRegexEngine } from 'shiki'

type BundledLanguage = 'javascript'
type BundledTheme = 'light-plus'
type Highlighter = HighlighterGeneric<BundledLanguage, BundledTheme>

const bundledLanguages: Record<BundledLanguage, DynamicImportLanguageRegistration> = {
	javascript: () => import('shiki/langs/javascript.mjs'),
}

const bundledThemes: Record<BundledTheme, DynamicImportThemeRegistration> = {
	'light-plus': () => import('shiki/themes/light-plus.mjs'),
}

const createHighlighter = /* @__PURE__ */ createdBundledHighlighter<BundledLanguage, BundledTheme>({
	langs: bundledLanguages,
	themes: bundledThemes,
	engine: () => createJavaScriptRegexEngine(),
})

const { codeToHtml, codeToHast, codeToTokensBase, codeToTokens, codeToTokensWithThemes, getSingletonHighlighter, getLastGrammarState } = /* @__PURE__ */ createSingletonShorthands<
	BundledLanguage,
	BundledTheme
>(createHighlighter)

export {
	bundledLanguages,
	bundledThemes,
	codeToHast,
	codeToHtml,
	codeToTokens,
	codeToTokensBase,
	codeToTokensWithThemes,
	createHighlighter,
	getLastGrammarState,
	getSingletonHighlighter,
}
export type { BundledLanguage, BundledTheme, Highlighter }
