import { ShikiBlock } from '../common/shiki-block'
import { Annotations, ColorMapping, getThemeColor } from '../common/annotations'

export type ApplyAnnotationsOptions = { lang: string; annotations?: Annotations; customColors?: ColorMapping }

export function applyAnnotations(highlightedCodeHtml: string, options: ApplyAnnotationsOptions) {
	const { annotations: { lineMarkings = [], inlineMarkings = [] } = {}, customColors } = options

	// TODO: Further implement function
	// const isTerminal = ['shellscript', 'shell', 'bash', 'sh', 'zsh'].includes(lang)
	//
	// // Generate HTML code from the title (if any), improving the ability to wrap long file paths
	// // into multiple lines by inserting a line break opportunity after each slash
	// const titleHtml = decodeURIComponent(title).replace(/([\\/])/g, '$1<wbr/>')

	const shikiBlock = new ShikiBlock(highlightedCodeHtml)
	shikiBlock.applyMarkings(lineMarkings, inlineMarkings)
	return shikiBlock.renderToHtml(customColors)
}

export const getBaseCss = (customColors?: ColorMapping) => `
pre.expressive-code {
	--ec-border: hsl(226, 0%, 50%);
	--ec-selection-bg: hsl(269, 79%, 54%, 0.4);
	--ec-mark-bg: ${getThemeColor('mark.background', customColors)};
	--ec-mark-border: ${getThemeColor('mark.border', customColors)};
	--ec-ins-bg: ${getThemeColor('ins.background', customColors)};
	--ec-ins-border: ${getThemeColor('ins.border', customColors)};
	--ec-ins-text: ${getThemeColor('ins.label', customColors)};
	--ec-del-bg: ${getThemeColor('del.background', customColors)};
	--ec-del-border: ${getThemeColor('del.border', customColors)};
	--ec-del-text: ${getThemeColor('del.label', customColors)};
}

pre.expressive-code {
	--padding-block: 1rem;
	position: relative;
	border: 1px solid var(--ec-border);
	padding: var(--padding-block) 0;
	margin: 0;
	font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
	font-size: 0.85rem;
	line-height: 1.65;
	overflow-y: hidden;
	overflow-x: auto;
	-webkit-text-size-adjust: none;
}

pre.expressive-code code {
	all: unset;
	display: inline-block;
	min-width: 100%;
	--padding-inline: 1.25rem;
}

pre.expressive-code code * {
	box-sizing: border-box;
}

pre.expressive-code code .line {
	--accent-margin: 0rem;
	min-height: 1.65em;
	min-width: calc(100% - var(--accent-margin));
	padding-inline-start: var(--padding-inline);
	padding-inline-end: calc(2 * var(--padding-inline));
}

pre.expressive-code code .line.mark,
pre.expressive-code code .line.ins,
pre.expressive-code code .line.del {
	--accent-margin: 0rem;
	--accent-width: 0.15rem;
	background: var(--ec-line-bg-color);
	margin-inline-start: var(--accent-margin);
	border-inline-start: var(--accent-width) solid var(--ec-line-border-color);
	padding-inline-start: calc(var(--padding-inline) - var(--accent-margin) - var(--accent-width)) !important;
}

pre.expressive-code code .line.mark::before,
pre.expressive-code code .line.ins::before,
pre.expressive-code code .line.del::before {
	position: absolute;
	left: 0.5rem;
}

pre.expressive-code code .line.mark {
	--ec-line-bg-color: var(--ec-mark-bg);
	--ec-line-border-color: var(--ec-mark-border);
}
pre.expressive-code code .line.ins {
	--ec-line-bg-color: var(--ec-ins-bg);
	--ec-line-border-color: var(--ec-ins-border);
}
pre.expressive-code code .line.ins::before {
	content: '+';
	color: var(--ec-ins-text);
}
pre.expressive-code code .line.del {
	--ec-line-bg-color: var(--ec-del-bg);
	--ec-line-border-color: var(--ec-del-border);
}
pre.expressive-code code .line.del::before {
	content: '-';
	color: var(--ec-del-text);
}
`
