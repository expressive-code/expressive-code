import { ShikiBlock } from '../common/shiki-block'
import { Annotations } from '../common/annotations'

export type ApplyAnnotationsOptions = { lang: string; annotations?: Annotations }

export function applyAnnotations(highlightedCodeHtml: string, options: ApplyAnnotationsOptions) {
	const { annotations: { lineMarkings = [], inlineMarkings = [] } = {} } = options

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

export const baseCss = `
:root {
	--theme-code-border: hsl(226, 0%, 50%);
	--theme-code-selection-bg: hsl(269, 79%, 54%, 0.4);
	--theme-code-mark-bg: hsl(226, 50%, 33%);
	--theme-code-mark-border: hsl(224, 50%, 54%);
	--theme-code-ins-bg: hsl(122, 22%, 23%);
	--theme-code-ins-border: hsl(128, 42%, 38%);
	--theme-code-ins-text: hsl(128, 31%, 65%);
	--theme-code-del-bg: hsl(338, 40%, 26%);
	--theme-code-del-border: hsl(338, 46%, 53%);
	--theme-code-del-text: hsl(338, 36%, 70%);
}

pre {
	--padding-block: 1rem;
	position: relative;
	border: 1px solid var(--theme-code-border);
	padding: var(--padding-block) 0;
	margin: 0;
	font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
	font-size: 0.85rem;
	line-height: 1.65;
	overflow-y: hidden;
	overflow-x: auto;
	-webkit-text-size-adjust: none;
}

pre code {
	all: unset;
	display: inline-block;
	min-width: 100%;
	--padding-inline: 1.25rem;
}

pre code * {
	box-sizing: border-box;
}

pre code .line {
	--accent-margin: 0rem;
	/*display: inline-block;*/
	min-height: 1.65em;
	min-width: calc(100% - var(--accent-margin));
	padding-inline-start: var(--padding-inline);
	padding-inline-end: calc(2 * var(--padding-inline));
}

pre code .line.mark,
pre code .line.ins,
pre code .line.del {
	--accent-margin: 0rem;
	--accent-width: 0.15rem;
	background: var(--line-marker-bg-color);
	margin-inline-start: var(--accent-margin);
	border-inline-start: var(--accent-width) solid var(--line-marker-border-color);
	padding-inline-start: calc(var(--padding-inline) - var(--accent-margin) - var(--accent-width)) !important;
}

pre code .line.mark::before,
pre code .line.ins::before,
pre code .line.del::before {
	position: absolute;
	left: 0.5rem;
}

pre code .line.mark {
	--line-marker-bg-color: var(--theme-code-mark-bg);
	--line-marker-border-color: var(--theme-code-mark-border);
}
pre code .line.ins {
	--line-marker-bg-color: var(--theme-code-ins-bg);
	--line-marker-border-color: var(--theme-code-ins-border);
}
pre code .line.ins::before {
		content: '+';
		color: var(--theme-code-ins-text);
}
pre code .line.del {
	--line-marker-bg-color: var(--theme-code-del-bg);
	--line-marker-border-color: var(--theme-code-del-border);
}
pre code .line.del::before {
	content: '-';
	color: var(--theme-code-del-text);
}
`
