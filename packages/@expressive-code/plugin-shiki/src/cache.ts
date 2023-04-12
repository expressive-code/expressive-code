import { Highlighter, Theme, getHighlighter } from 'shiki'
import { ExpressiveCodeTheme } from '@expressive-code/core'

let highlighterPromise: Promise<Highlighter> | undefined

export async function getCachedHighlighter({ theme }: { theme: ExpressiveCodeTheme }): Promise<Highlighter> {
	if (highlighterPromise === undefined) {
		highlighterPromise = getHighlighter({ theme })
	}
	const highlighter = await highlighterPromise
	if (!highlighter.getLoadedThemes().includes(theme.name as Theme)) {
		await highlighter.loadTheme(theme)
	}
	return highlighter
}
