import { describe, expect, test } from 'vitest'
import { ExpressiveCodeBlock, type ExpressiveCodeEngineConfig, ExpressiveCodeEngine } from '@expressive-code/core'
import { toHtml } from '@expressive-code/core/hast'
import { pluginTextMarkers } from '../src'
import { TextMarkerAnnotation } from '../src/annotations'

async function renderCode(options: {
	code: string
	language?: string | undefined
	meta?: string | undefined
	props?: ExpressiveCodeBlock['props'] | undefined
	defaultProps?: ExpressiveCodeEngineConfig['defaultProps'] | undefined
}) {
	const { code, language = 'js', meta = '', props, defaultProps } = options
	const engine = new ExpressiveCodeEngine({
		plugins: [pluginTextMarkers()],
		defaultProps,
	})
	const { renderedGroupContents } = await engine.render({
		code,
		language,
		meta,
		props,
	})
	expect(renderedGroupContents).toHaveLength(1)
	return {
		codeBlock: renderedGroupContents[0].codeBlock,
		renderedBlockAst: renderedGroupContents[0].renderedBlockAst,
	}
}

function getLineMarkerTypes(line: string, code: ExpressiveCodeBlock) {
	const markerLine = code.getLines().find((currentLine) => currentLine.text === line)
	expect(markerLine).toBeDefined()
	return (markerLine?.getAnnotations().filter((annotation) => annotation instanceof TextMarkerAnnotation && !annotation.inlineRange) as TextMarkerAnnotation[]).map(
		(annotation) => annotation.markerType
	)
}

describe('Annotation comment support', () => {
	test('creates full-line markers from annotation comments', async () => {
		const { codeBlock } = await renderCode({
			code: ['const one = 1', '// [!mark]', 'const two = 2'].join('\n'),
		})

		expect(codeBlock.code).toEqual(['const one = 1', 'const two = 2'].join('\n'))
		expect(getLineMarkerTypes('const two = 2', codeBlock)).toEqual(['mark'])
	})

	test('supports marker tag aliases', async () => {
		const { codeBlock } = await renderCode({
			code: ['const a = 1', '// [!add]', 'const b = 2', '// [!+]', 'const c = 3', '// [!rem]', 'const d = 4', '// [!-]', 'const e = 5'].join('\n'),
		})

		expect(codeBlock.code).toEqual(['const a = 1', 'const b = 2', 'const c = 3', 'const d = 4', 'const e = 5'].join('\n'))
		expect(getLineMarkerTypes('const b = 2', codeBlock)).toEqual(['ins'])
		expect(getLineMarkerTypes('const c = 3', codeBlock)).toEqual(['ins'])
		expect(getLineMarkerTypes('const d = 4', codeBlock)).toEqual(['del'])
		expect(getLineMarkerTypes('const e = 5', codeBlock)).toEqual(['del'])
	})

	test('uses annotation content as line label and removes it from display and copied code', async () => {
		const { codeBlock, renderedBlockAst } = await renderCode({
			code: ['const one = 1', '// [!ins] A', 'const two = 2'].join('\n'),
		})

		expect(codeBlock.code).toEqual(['const one = 1', 'const two = 2'].join('\n'))
		expect(codeBlock.getCopyText()).toEqual(['const one = 1', 'const two = 2'].join('\n'))

		const line = codeBlock.getLines().find((currentLine) => currentLine.text === 'const two = 2')
		expect(line).toBeDefined()
		const annotations = (line?.getAnnotations().filter((annotation) => annotation instanceof TextMarkerAnnotation && !annotation.inlineRange) as TextMarkerAnnotation[]) || []
		expect(annotations).toHaveLength(1)
		expect(annotations[0].markerType).toBe('ins')
		expect(annotations[0].label).toBeUndefined()

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<div class="tm-label">A</div>')
		expect(html).toMatch(/<div class="code">\s*<div class="tm-label">A<\/div>/)
		expect(html).toContain('highlight ins has-label')
		expect(html).toContain('A')
		expect(html).not.toContain('ac-content')
	})

	test('creates inline markers when targeting search terms', async () => {
		const { codeBlock } = await renderCode({
			code: ['const one = 1', '// [!mark:"target"]', 'const target = one + 1'].join('\n'),
		})
		const targetLine = codeBlock.getLines().find((line) => line.text === 'const target = one + 1')
		expect(targetLine).toBeDefined()

		const inlineMarkers =
			(targetLine?.getAnnotations().filter((annotation) => annotation instanceof TextMarkerAnnotation && annotation.inlineRange) as TextMarkerAnnotation[]) || []
		expect(inlineMarkers).toHaveLength(1)
		expect(inlineMarkers[0].markerType).toBe('mark')
		expect(inlineMarkers[0].inlineRange).toEqual({
			columnStart: 6,
			columnEnd: 12,
		})
	})

	test('removes deleted targets from copied code by default', async () => {
		const { codeBlock } = await renderCode({
			code: ['const keep = 1', '// [!del]', 'const remove = 2'].join('\n'),
		})

		expect(codeBlock.code).toEqual(['const keep = 1', 'const remove = 2'].join('\n'))
		expect(codeBlock.getCopyText()).toEqual('const keep = 1')
	})

	test('supports del copy behavior via per-block prop', async () => {
		const { codeBlock } = await renderCode({
			code: ['const keep = 1', '// [!del]', 'const remove = 2'].join('\n'),
			props: {
				delCopyBehavior: 'comment',
			},
		})

		expect(codeBlock.getCopyText()).toEqual(['const keep = 1', '// const remove = 2'].join('\n'))
	})

	test('supports del copy behavior via meta options', async () => {
		const { codeBlock } = await renderCode({
			code: ['const keep = 1', '// [!del]', 'const remove = 2'].join('\n'),
			meta: 'delCopyBehavior=comment',
		})

		expect(codeBlock.getCopyText()).toEqual(['const keep = 1', '// const remove = 2'].join('\n'))
	})

	test('supports del copy behavior via defaultProps', async () => {
		const { codeBlock } = await renderCode({
			code: ['const keep = 1', '// [!del]', 'const remove = 2'].join('\n'),
			defaultProps: {
				delCopyBehavior: 'keep',
			},
		})

		expect(codeBlock.getCopyText()).toEqual(['const keep = 1', 'const remove = 2'].join('\n'))
	})

	test('supports del copy behavior for line markers added via meta', async () => {
		const { codeBlock } = await renderCode({
			code: ['const keep = 1', 'const remove = 2'].join('\n'),
			meta: 'del={2}',
		})

		expect(codeBlock.getCopyText()).toEqual('const keep = 1')
	})

	test('supports commented del copy behavior for line markers added via meta', async () => {
		const { codeBlock } = await renderCode({
			code: ['const keep = 1', 'const remove = 2'].join('\n'),
			meta: 'del={2} delCopyBehavior=comment',
		})

		expect(codeBlock.getCopyText()).toEqual(['const keep = 1', '// const remove = 2'].join('\n'))
	})

	test('supports del copy behavior for diff syntax markers', async () => {
		const { codeBlock } = await renderCode({
			code: ['+const keep = 1', '-const remove = 2'].join('\n'),
			language: 'diff',
		})

		expect(codeBlock.getCopyText()).toEqual('const keep = 1')
	})

	test('preserves annotation comment syntax when commenting out deleted lines', async () => {
		const { codeBlock } = await renderCode({
			code: ['const keep = 1', '/* [!del] */', 'const remove = 2'].join('\n'),
			props: {
				delCopyBehavior: 'comment',
			},
		})

		expect(codeBlock.getCopyText()).toEqual(['const keep = 1', '/* const remove = 2 */'].join('\n'))
	})

	test('renders long labels between lines instead of overlaying target code lines', async () => {
		const { codeBlock, renderedBlockAst } = await renderCode({
			code: ['const one = 1', '// [!ins] This is a long label', 'const two = 2'].join('\n'),
		})

		const targetLine = codeBlock.getLines().find((line) => line.text === 'const two = 2')
		expect(targetLine).toBeDefined()
		const lineMarkers = (targetLine?.getAnnotations().filter((annotation) => annotation instanceof TextMarkerAnnotation && !annotation.inlineRange) as TextMarkerAnnotation[]) || []
		expect(lineMarkers).toHaveLength(1)
		expect(lineMarkers[0].label).toBeUndefined()

		const html = toHtml(renderedBlockAst)
		expect((html.match(/class="ec-line/g) || []).length).toBe(3)
		expect((html.match(/class="ec-line(?: has-label)? highlight(?: tm-between)? ins(?: has-label)?"/g) || []).length).toBe(2)
		expect(html).toContain('<div class="tm-label">This is a long label</div>')
		expect(html).toMatch(/<div class="code">\s*<div class="tm-label">This is a long label<\/div>/)
		expect(html).toContain('<div class="tm-label">This is a long label</div>\n</div>')
		expect(html).toContain('This is a long label')
	})

	test('renders three-character labels between lines', async () => {
		const { codeBlock, renderedBlockAst } = await renderCode({
			code: ['const one = 1', '// [!ins] abc', 'const two = 2'].join('\n'),
		})

		const targetLine = codeBlock.getLines().find((line) => line.text === 'const two = 2')
		expect(targetLine).toBeDefined()
		const lineMarkers = (targetLine?.getAnnotations().filter((annotation) => annotation instanceof TextMarkerAnnotation && !annotation.inlineRange) as TextMarkerAnnotation[]) || []
		expect(lineMarkers).toHaveLength(1)
		expect(lineMarkers[0].label).toBeUndefined()

		const html = toHtml(renderedBlockAst)
		expect((html.match(/class="ec-line/g) || []).length).toBe(3)
		expect((html.match(/class="ec-line(?: has-label)? highlight(?: tm-between)? ins(?: has-label)?"/g) || []).length).toBe(2)
		expect(html).toContain('<div class="tm-label">abc</div>')
		expect(html).toContain('abc')
	})

	test('anchors long labels to inline search matches when using anchorStart placement', async () => {
		const { renderedBlockAst } = await renderCode({
			code: ['const one = 1', '// [!del:"children"] 2 much', '  {children &&'].join('\n'),
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<div class="tm-label">2 much</div>')
		expect(html).not.toContain('ac-content')
	})

	test('keeps generated metadata label lines at normal line height', async () => {
		const { renderedBlockAst } = await renderCode({
			code: ['const one = 1', 'const two = 2'].join('\n'),
			meta: `ins={"This is a long label":2}`,
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<div class="tm-label">This is a long label</div>\n</div>')
	})

	test('keeps metadata long labels inline when the target line is intentionally empty', async () => {
		const { renderedBlockAst } = await renderCode({
			code: ['const one = 1', '', 'const two = 2'].join('\n'),
			meta: `ins={"This is a long label":2}`,
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<div class="tm-label">This is a long label</div>')
		expect(html).not.toContain('tm-between')
	})

	test('renders annotation comment long labels between lines even when target lines are empty', async () => {
		const { renderedBlockAst } = await renderCode({
			code: ['const one = 1', '// [!ins:2] This is a long label', '', 'const two = 2'].join('\n'),
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<div class="tm-label">This is a long label</div>')
		expect(html).toContain('tm-between')
	})
})
