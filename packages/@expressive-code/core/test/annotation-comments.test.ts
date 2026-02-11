import { describe, expect, test } from 'vitest'
import { ExpressiveCodePlugin } from '../src/common/plugin'
import { addClassName, h, setProperty, toHtml, type ElementContent } from '../src/hast'
import { WrapperAnnotation, getMultiPluginTestResult, toSanitizedHtml } from './utils'

describe('Annotation comment handlers', () => {
	test('run before syntax analysis and clean annotation tags from display code', async () => {
		let codeBeforeSyntaxAnalysis = ''
		const plugin: ExpressiveCodePlugin = {
			name: 'Annotation comments',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					handle: ({ targets }) => {
						targets.forEach((target) => {
							target.line.addAnnotation(new WrapperAnnotation({ selector: 'mark' }))
						})
					},
				},
			],
			hooks: {
				performSyntaxAnalysis: ({ codeBlock }) => {
					codeBeforeSyntaxAnalysis = codeBlock.code
				},
			},
		}

		const { renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note]', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toSanitizedHtml(renderedBlockAst)
		expect(codeBeforeSyntaxAnalysis).toEqual(['const one = 1', 'const two = 2'].join('\n'))
		expect(html).toContain('<mark>')
		expect(html).toContain('const two = 2')
	})

	test('throws if two handlers register the same tag without override', async () => {
		const pluginA: ExpressiveCodePlugin = {
			name: 'A',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					handle: () => undefined,
				},
			],
		}
		const pluginB: ExpressiveCodePlugin = {
			name: 'B',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					handle: () => undefined,
				},
			],
		}

		await expect(
			getMultiPluginTestResult({
				plugins: [pluginA, pluginB],
				input: [
					{
						code: ['const one = 1', '// [!note]', 'const two = 2'].join('\n'),
						language: 'js',
						meta: '',
					},
				],
			})
		).rejects.toThrow('already handled by plugin "A"')
	})

	test('allows overriding an existing tag when overrideExisting is set', async () => {
		const pluginA: ExpressiveCodePlugin = {
			name: 'A',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					handle: ({ targets }) => {
						targets.forEach((target) => {
							target.line.addAnnotation(new WrapperAnnotation({ selector: 'mark' }))
						})
					},
				},
			],
		}
		const pluginB: ExpressiveCodePlugin = {
			name: 'B',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					overrideExisting: true,
					handle: ({ targets }) => {
						targets.forEach((target) => {
							target.line.addAnnotation(new WrapperAnnotation({ selector: 'ins' }))
						})
					},
				},
			],
		}

		const { renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [pluginA, pluginB],
			input: [
				{
					code: ['const one = 1', '// [!note]', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toSanitizedHtml(renderedBlockAst)
		expect(html).toContain('<ins>')
		expect(html).not.toContain('<mark>')
	})

	test('supports content.render convenience annotations', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered comment content',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						render: {
							placement: {
								anchor: 'firstTarget',
								line: 'current',
								col: 'anchorEnd',
							},
							contentRenderer: 'plaintext',
						},
					},
					handle: () => undefined,
				},
			],
		}

		const { renderedBlockAst, codeBlock } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note] Hello docs', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(codeBlock.code).toEqual(['const one = 1', 'const two = 2'].join('\n'))
		const html = toSanitizedHtml(renderedBlockAst)
		expect(html).toContain('<span>Hello docs</span>')
		expect(html).toContain('const two = 2')
	})

	test('provides same-line content text for non-note tags', async () => {
		let resolvedContentLines: string[] | undefined

		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content tag variant',
			annotationCommentHandlers: [
				{
					tagNames: ['ins'],
					content: {
						displayCode: 'remove',
						render: {
							placement: ({ content }) => {
								resolvedContentLines = content.lines
								return {
									anchor: 'firstTarget',
									line: 'current',
									col: 'lineStart',
								}
							},
							contentRenderer: 'plaintext',
						},
					},
					handle: () => undefined,
				},
			],
		}

		await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!ins] X', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(resolvedContentLines).toEqual(['X'])
	})

	test('supports rendering current-line content at line start', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content line start',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						render: {
							placement: {
								anchor: 'firstTarget',
								line: 'current',
								col: 'lineStart',
							},
							contentRenderer: 'plaintext',
						},
					},
					handle: () => undefined,
				},
			],
		}

		const { renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note] Hello docs', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<div class="code"><span class="ac-content inline start"')
		expect(html).toContain('Hello docs</span>')
	})

	test('anchors inline target placements to the matched inline range', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered inline target anchoring',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						render: {
							placement: {
								anchor: 'firstTarget',
								line: 'before',
								col: 'anchorStart',
							},
							contentRenderer: 'plaintext',
						},
					},
					handle: () => undefined,
				},
			],
		}

		const { renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note:"children"] Hello docs', '  {children &&'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('ac-content line-before anchor-start')
		expect(html).toContain('--ecAnchorStart:3;--ecAnchorEnd:11;--ecContentCol:3')
	})

	test('anchors annotation placements to the annotation column for standalone comments', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered annotation anchoring',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						render: {
							placement: {
								anchor: 'annotation',
								line: 'before',
								col: 'anchorStart',
							},
							contentRenderer: 'plaintext',
						},
					},
					handle: () => undefined,
				},
			],
		}

		const { renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['<button', '  role="button"', '  {...props}', '        // [!note:0] Some label', '  value={value}', '>'].join('\n'),
					language: 'jsx',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('ac-content line-before anchor-start')
		expect(html).toContain('--ecAnchorStart:8;')
		expect(html).toContain('--ecContentCol:8')
		expect(html).toContain('Some label')
	})

	test('provides targets to content.render.placement resolver', async () => {
		let resolvedPrimaryTarget: { lineIndex: number; start: number; end: number } | undefined

		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered resolve context',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						render: {
							placement: ({ targets }) => {
								const firstTarget = targets[0]
								if (firstTarget?.inlineRange) {
									resolvedPrimaryTarget = {
										lineIndex: firstTarget.lineIndex,
										start: firstTarget.inlineRange.columnStart,
										end: firstTarget.inlineRange.columnEnd,
									}
								}
								return {
									anchor: 'firstTarget',
									line: 'before',
									col: 'anchorStart',
								}
							},
							contentRenderer: 'plaintext',
						},
					},
					handle: () => undefined,
				},
			],
		}

		await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note:"children"] Hello docs', '  {children &&'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(resolvedPrimaryTarget).toEqual({
			lineIndex: 2,
			start: 3,
			end: 11,
		})
	})

	test('provides annotationLine to handler context', async () => {
		let annotationLineText: string | undefined

		const plugin: ExpressiveCodePlugin = {
			name: 'Annotation line context',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					handle: ({ annotationLine }) => {
						annotationLineText = annotationLine?.text
					},
				},
			],
		}

		await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '        // [!note:0] no targets', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(annotationLineText).toBe('        // [!note:0] no targets')
	})

	test('allows custom content.render.contentWrapper functions to enrich content wrappers', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content wrapper enrichment',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						render: {
							placement: {
								anchor: 'firstTarget',
								line: 'current',
								col: 'lineStart',
							},
							contentRenderer: 'plaintext',
							contentWrapper: ({ content, contentWrapper }) => {
								addClassName(contentWrapper, 'tm-ac-label')
								addClassName(contentWrapper, 'del')
								contentWrapper.children = [{ type: 'text', value: content.text } satisfies ElementContent]
							},
						},
					},
					handle: () => undefined,
				},
			],
		}

		const { renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note] 2', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<span class="ac-content inline start tm-ac-label del"')
		expect(html).toContain('>2</span>')
		expect(html).not.toContain('<span class="tm-ac-label')
	})

	test('allows custom content.render.contentWrapper functions to fully control wrapper children', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content wrapper replacement',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						render: {
							placement: {
								anchor: 'firstTarget',
								line: 'current',
								col: 'lineStart',
							},
							contentRenderer: 'plaintext',
							contentWrapper: ({ content, contentWrapper }) => {
								contentWrapper.children.push({ type: 'text', value: `(${content.text})` } satisfies ElementContent)
							},
						},
					},
					handle: () => undefined,
				},
			],
		}

		const { renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note] X', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('(X)</span>')
		expect(html).toContain('<span class="ac-content inline start"')
	})

	test('allows custom content.render.contentWrapper functions to replace the wrapper element', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content wrapper reassignment',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						render: {
							placement: {
								anchor: 'firstTarget',
								line: 'current',
								col: 'lineStart',
							},
							contentRenderer: 'plaintext',
							contentWrapper: (context) => h('div.tm-label', context.content.text),
						},
					},
					handle: () => undefined,
				},
			],
		}

		const { renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note] X', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<div class="tm-label">X</div>')
		expect(html).not.toContain('ac-content inline start')
	})

	test('allows custom content.render.contentWrapper functions to retag and restyle the wrapper', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content wrapper retag',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						render: {
							placement: {
								anchor: 'firstTarget',
								line: 'current',
								col: 'lineStart',
							},
							contentRenderer: 'plaintext',
							contentWrapper: ({ content, contentWrapper }) => {
								setProperty(contentWrapper, 'className', ['tm-label'])
								setProperty(contentWrapper, 'style', null)
								contentWrapper.tagName = 'div'
								contentWrapper.children = [{ type: 'text', value: content.text } satisfies ElementContent]
							},
						},
					},
					handle: () => undefined,
				},
			],
		}

		const { renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note] X', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<div class="tm-label">X</div>')
		expect(html).not.toContain('ac-content inline start')
	})

	test('supports content.render.parentLine for generated between-lines hosts', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content line hook',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						render: {
							placement: {
								anchor: 'firstTarget',
								line: 'before',
								col: 'lineStart',
							},
							contentRenderer: 'plaintext',
							parentLine: ({ lineAst, isGeneratedLine }) => {
								if (!isGeneratedLine) return
								addClassName(lineAst, 'generated-content-line')
							},
						},
					},
					handle: () => undefined,
				},
			],
		}

		const { renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note] Hello docs', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('generated-content-line')
		expect(html).toContain('<div class="code"><div class="ac-content line-before start"')
	})

	test('supports all anchor x line x col placement combinations', async () => {
		const anchors = ['annotation', 'firstTarget', 'lastTarget', 'allTargets'] as const
		const lines = ['current', 'before', 'after'] as const
		const cols = ['anchorStart', 'anchorEnd', 'lineStart', 'lineEnd'] as const
		const combinations = anchors.flatMap((anchor) => lines.flatMap((line) => cols.map((col) => ({ anchor, line, col }))))

		const plugin: ExpressiveCodePlugin = {
			name: 'Placement matrix',
			annotationCommentHandlers: combinations.map((combination, index) => ({
				tagNames: [`case${index}`],
				content: {
					displayCode: 'remove',
					render: {
						placement: {
							anchor: combination.anchor,
							line: combination.line,
							col: combination.col,
						},
						contentRenderer: 'plaintext',
					},
				},
				handle: () => undefined,
			})),
		}

		const codeLines = ['const first = 1', 'const second = 2']
		const commentLines = combinations.map((combination, index) => `// [!case${index}] ${combination.anchor}-${combination.line}-${combination.col}`)
		const code = [...codeLines, ...commentLines].join('\n')

		const { renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [{ code, language: 'js', meta: '' }],
		})

		const html = toHtml(renderedBlockAst)
		combinations.forEach((combination) => {
			const lineClass = combination.line === 'before' ? 'line-before' : combination.line === 'after' ? 'line-after' : 'inline'
			const colClass = combination.col === 'anchorStart' ? 'anchor-start' : combination.col === 'anchorEnd' ? 'anchor-end' : combination.col === 'lineStart' ? 'start' : 'end'
			expect(html).toContain(`ac-content ${lineClass} ${colClass}`)
		})

		const contentColMatches = html.match(/--ecContentCol:\d+/g) || []
		expect(contentColMatches.length).toBeGreaterThan(0)
		const contentCols = contentColMatches.map((match) => Number.parseInt(match.replace('--ecContentCol:', ''), 10))
		expect(contentCols).toContain(0)
		expect(contentCols.some((column) => column > 0)).toBe(true)
	})

	test('supports render transforms that insert rendered lines', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Render transforms',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					handle: ({ targets }) => {
						const firstTarget = targets[0]
						if (!firstTarget) return
						firstTarget.line.addRenderTransform({
							type: 'insert',
							position: 'before',
							onDeleteLine: 'stick-next',
							render: ({ renderEmptyLine }) => {
								const line = renderEmptyLine()
								line.codeWrapper.children.push(h('strong', 'Inserted note'))
								return line.lineAst
							},
						})
					},
				},
			],
		}

		const { renderedBlockAst, codeBlock } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note]', 'const two = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(codeBlock.code).toEqual(['const one = 1', 'const two = 2'].join('\n'))
		const html = toSanitizedHtml(renderedBlockAst)
		expect((html.match(/<div class="code">/g) || []).length).toBe(3)
		expect(html).toMatch(/Inserted note[\s\S]*const two = 2/)
	})

	test('resolves render transform anchors by source line when mixed before and after inserts are registered', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Render transform anchor order',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					handle: ({ targets }) => {
						const target = targets[0]
						if (!target) return
						target.line.addRenderTransform({
							type: 'insert',
							position: 'before',
							onDeleteLine: 'stick-next',
							render: ({ renderEmptyLine }) => {
								const line = renderEmptyLine()
								line.codeWrapper.children.push(h('strong', `before ${target.line.text}`))
								return line.lineAst
							},
						})
						target.line.addRenderTransform({
							type: 'insert',
							position: 'after',
							onDeleteLine: 'stick-next',
							render: ({ renderEmptyLine }) => {
								const line = renderEmptyLine()
								line.codeWrapper.children.push(h('strong', `after ${target.line.text}`))
								return line.lineAst
							},
						})
					},
				},
			],
		}

		const { renderedBlockAst, codeBlock } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note]', 'const two = 2', '// [!note]', 'const three = 3'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(codeBlock.code).toEqual(['const one = 1', 'const two = 2', 'const three = 3'].join('\n'))
		const html = toSanitizedHtml(renderedBlockAst)
		expect(html).toMatch(/before const two = 2[\s\S]*const two = 2[\s\S]*after const two = 2/)
		expect(html).toMatch(/before const three = 3[\s\S]*const three = 3[\s\S]*after const three = 3/)
	})
})

describe('Annotation comment copy transforms', () => {
	test('are applied by codeBlock.getCopyText', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Copy transforms',
			annotationCommentHandlers: [
				{
					tagNames: ['del'],
					handle: ({ targets }) => {
						targets.forEach(({ line, inlineRange }) => {
							if (inlineRange) {
								line.addCopyTransform({
									type: 'editText',
									inlineRange,
									newText: '',
								})
								return
							}
							line.addCopyTransform({
								type: 'removeLine',
							})
						})
					},
				},
			],
		}

		const { codeBlock } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const keep = 1', '// [!del]', 'const remove = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(codeBlock.code).toEqual(['const keep = 1', 'const remove = 2'].join('\n'))
		expect(codeBlock.getCopyText()).toEqual('const keep = 1')
	})

	test('discards edit transforms after the same source line was removed', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Copy transform operation ordering',
			annotationCommentHandlers: [
				{
					tagNames: ['del'],
					handle: ({ targets }) => {
						targets.forEach(({ line, inlineRange }) => {
							if (inlineRange) return
							line.addCopyTransform({
								type: 'removeLine',
							})
							line.addCopyTransform({
								type: 'editText',
								newText: 'THIS MUST NOT APPEAR',
							})
						})
					},
				},
			],
		}

		const { codeBlock } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const keep = 1', '// [!del]', 'const remove = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(codeBlock.getCopyText()).toEqual('const keep = 1')
	})

	test('supports content.copyCode convenience cleanup', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Copy content cleanup',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'keep',
						copyCode: 'remove',
					},
					handle: () => undefined,
				},
			],
		}

		const { codeBlock } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const keep = 1', '// [!note] Remove me from copied text', 'const stay = 2'].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(codeBlock.code).toEqual(['const keep = 1', '// Remove me from copied text', 'const stay = 2'].join('\n'))
		expect(codeBlock.getCopyText()).toEqual(['const keep = 1', 'const stay = 2'].join('\n'))
	})
})
