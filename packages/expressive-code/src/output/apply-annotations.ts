import { ShikiBlock } from '../common/shiki-block'
import { Annotations } from '../common/annotations'

export type ApplyAnnotationsOptions = { highlightedCodeHtml: string; lang: string; annotations: Annotations }

export function applyAnnotations(options: ApplyAnnotationsOptions) {
	const {
		highlightedCodeHtml,
		annotations: { lineMarkings = [], inlineMarkings = [] },
	} = options

	// TODO: Further implement function
	// const isTerminal = ['shellscript', 'shell', 'bash', 'sh', 'zsh'].includes(lang)
	//
	// // Generate HTML code from the title (if any), improving the ability to wrap long file paths
	// // into multiple lines by inserting a line break opportunity after each slash
	// const titleHtml = decodeURIComponent(title).replace(/([\\/])/g, '$1<wbr/>')

	const shikiBlock = new ShikiBlock(highlightedCodeHtml)
	shikiBlock.applyMarkings(lineMarkings, inlineMarkings)
	return shikiBlock.renderToHtml()
}
