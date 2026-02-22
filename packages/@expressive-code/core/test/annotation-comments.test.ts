import { describe, expect, test } from 'vitest'
import { ExpressiveCodeEngine } from '../src/common/engine'
import { ExpressiveCodePlugin } from '../src/common/plugin'
import { addClassName, h, setProperty, toHtml, type ElementContent } from '../src/hast'
import { WrapperAnnotation, getMultiPluginTestResult, toSanitizedHtml } from './utils'

describe('Annotation comment handlers', () => {
	test('Runs before syntax analysis and cleans annotation tags from display code', async () => {
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
					code: [
						// Note tag line should be removed before syntax highlighting
						'const one = 1',
						'// [!note]',
						'const two = 2',
					].join('\n'),
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

	test('Supports ignoreTags meta options as booleans to skip all annotation processing', async () => {
		const processedTags: string[] = []
		const plugin: ExpressiveCodePlugin = {
			name: 'Ignore meta boolean',
			annotationCommentHandlers: [
				{
					tagNames: ['note', 'warn'],
					handle: ({ annotationComment, targets }) => {
						processedTags.push(annotationComment.tag.name)
						targets.forEach((target) => {
							target.line.addAnnotation(new WrapperAnnotation({ selector: 'mark' }))
						})
					},
				},
			],
		}

		const { codeBlock, renderedBlockAst } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note]', 'const two = 2', '// [!warn]', 'const three = 3'].join('\n'),
					language: 'js',
					meta: 'ignoreTags',
				},
			],
		})

		expect(processedTags).toEqual([])
		expect(codeBlock.code).toContain('// [!note]')
		expect(codeBlock.code).toContain('// [!warn]')
		const html = toSanitizedHtml(renderedBlockAst)
		expect(html).not.toContain('<mark>')
	})

	test('Supports ignore-tags meta option strings with comma-separated tag names and optional counts', async () => {
		const processedTags: string[] = []
		const plugin: ExpressiveCodePlugin = {
			name: 'Ignore meta strings',
			annotationCommentHandlers: [
				{
					tagNames: ['note', 'warn'],
					handle: ({ annotationComment, targets }) => {
						processedTags.push(annotationComment.tag.name)
						targets.forEach((target) => {
							target.line.addAnnotation(new WrapperAnnotation({ selector: 'mark' }))
						})
					},
				},
			],
		}

		const { codeBlock } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note]', 'const two = 2', '// [!warn]', 'const three = 3', '// [!note]', 'const four = 4'].join('\n'),
					language: 'js',
					meta: 'ignore-tags=note:1',
				},
			],
		})

		expect(processedTags).toEqual(['warn', 'note'])
		expect(codeBlock.code).toContain('// [!note]')
		expect(codeBlock.code).not.toContain('// [!warn]')
		expect((codeBlock.code.match(/\[!note\]/g) || []).length).toBe(1)
	})

	test('Supports ignore-tags meta option strings with wildcard matching', async () => {
		const processedTags: string[] = []
		const plugin: ExpressiveCodePlugin = {
			name: 'Ignore meta wildcard',
			annotationCommentHandlers: [
				{
					tagNames: ['note', 'warn'],
					handle: ({ annotationComment, targets }) => {
						processedTags.push(annotationComment.tag.name)
						targets.forEach((target) => {
							target.line.addAnnotation(new WrapperAnnotation({ selector: 'mark' }))
						})
					},
				},
			],
		}

		const { codeBlock } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note]', 'const two = 2', '// [!warn]', 'const three = 3'].join('\n'),
					language: 'js',
					meta: 'ignore-tags=*:1',
				},
			],
		})

		expect(processedTags).toEqual(['warn'])
		expect(codeBlock.code).toContain('// [!note]')
		expect(codeBlock.code).not.toContain('// [!warn]')
	})

	test('Supports ignore-tags meta option ranges based on annotation source line indices', async () => {
		const processedTags: string[] = []
		const plugin: ExpressiveCodePlugin = {
			name: 'Ignore meta ranges',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					handle: ({ annotationComment, targets }) => {
						processedTags.push(annotationComment.tag.name)
						targets.forEach((target) => {
							target.line.addAnnotation(new WrapperAnnotation({ selector: 'mark' }))
						})
					},
				},
			],
		}

		const { codeBlock } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note]', 'const two = 2', '// [!note]', 'const three = 3'].join('\n'),
					language: 'js',
					meta: 'ignore-tags={1-2}',
				},
			],
		})

		expect(processedTags).toEqual(['note'])
		expect((codeBlock.code.match(/\[!note\]/g) || []).length).toBe(1)
		expect(codeBlock.code).toContain('const three = 3')
	})

	test('Applies multiple ignore-tags meta option kinds in a single block', async () => {
		const processedTags: string[] = []
		const plugin: ExpressiveCodePlugin = {
			name: 'Ignore meta mixed kinds',
			annotationCommentHandlers: [
				{
					tagNames: ['note', 'warn'],
					handle: ({ annotationComment, targets }) => {
						processedTags.push(annotationComment.tag.name)
						targets.forEach((target) => {
							target.line.addAnnotation(new WrapperAnnotation({ selector: 'mark' }))
						})
					},
				},
			],
		}

		const { codeBlock } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note]', 'const two = 2', '// [!warn]', 'const three = 3', '// [!note]', 'const four = 4'].join('\n'),
					language: 'js',
					meta: 'ignore-tags=note:1 ignore-tags={3-3}',
				},
			],
		})

		expect(processedTags).toEqual(['note'])
		expect(codeBlock.code).toContain('// [!warn]')
		expect((codeBlock.code.match(/\[!note\]/g) || []).length).toBe(1)
		expect(codeBlock.code).toContain('const four = 4')
	})

	test('Supports ignoreTags block props with mixed definition types', async () => {
		const processedTags: string[] = []
		const plugin: ExpressiveCodePlugin = {
			name: 'Ignore props mixed kinds',
			annotationCommentHandlers: [
				{
					tagNames: ['note', 'warn'],
					handle: ({ annotationComment, targets }) => {
						processedTags.push(annotationComment.tag.name)
						targets.forEach((target) => {
							target.line.addAnnotation(new WrapperAnnotation({ selector: 'mark' }))
						})
					},
				},
			],
		}

		const { codeBlock } = await getMultiPluginTestResult({
			plugins: [plugin],
			input: [
				{
					code: ['const one = 1', '// [!note]', 'const two = 2', '// [!warn]', 'const three = 3', '// [!note]', 'const four = 4'].join('\n'),
					language: 'js',
					meta: '',
					props: {
						ignoreTags: ['note:1', { range: '3-3' }],
					},
				},
			],
		})

		expect(processedTags).toEqual(['note'])
		expect(codeBlock.code).toContain('// [!warn]')
		expect((codeBlock.code.match(/\[!note\]/g) || []).length).toBe(1)
		expect(codeBlock.code).toContain('const four = 4')
	})

	test('Transfers ignore-tags metadata into code block ignoreTags props', async () => {
		const { codeBlock } = await getMultiPluginTestResult({
			plugins: [{ name: 'Ignore props transfer' }],
			input: [
				{
					code: ['const one = 1', 'const two = 2'].join('\n'),
					language: 'js',
					meta: 'ignore-tags=note ignoreTags={1-1}',
					props: {
						ignoreTags: 'warn',
					},
				},
			],
		})

		expect(codeBlock.props.ignoreTags).toEqual(['warn', 'note', { range: '1-1' }])
	})

	test('Keeps the first handler and logs a warning if two handlers register the same tag without override', async () => {
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
					handle: ({ targets }) => {
						targets.forEach((target) => {
							target.line.addAnnotation(new WrapperAnnotation({ selector: 'ins' }))
						})
					},
				},
			],
		}
		const warnings: string[] = []
		const engine = new ExpressiveCodeEngine({
			plugins: [pluginA, pluginB],
			logger: {
				warn: (message) => warnings.push(message),
				error: () => undefined,
			},
		})

		const { renderedGroupContents } = await engine.render([
			{
				code: [
					// Duplicate tag registration should keep the first plugin handler
					'const one = 1',
					'// [!note]',
					'const two = 2',
				].join('\n'),
				language: 'js',
				meta: '',
			},
		])
		const html = toSanitizedHtml(renderedGroupContents[0].renderedBlockAst)
		expect(html).toContain('<mark>')
		expect(html).not.toContain('<ins>')
		expect(warnings).toHaveLength(1)
		expect(warnings[0]).toContain('already handled by plugin "A"')
		expect(warnings[0]).toContain('- Plugin "B" tried to register annotation comment tag "note"')
	})

	test('Allows overriding an existing tag when overrideExisting is set', async () => {
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
					code: [
						// Override should let plugin B replace plugin A's handler
						'const one = 1',
						'// [!note]',
						'const two = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toSanitizedHtml(renderedBlockAst)
		expect(html).toContain('<ins>')
		expect(html).not.toContain('<mark>')
	})

	test('Supports content.render convenience annotations', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered comment content',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
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
					code: [
						// Note content should render while the annotation line is removed
						'const one = 1',
						'// [!note] Hello docs',
						'const two = 2',
					].join('\n'),
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

	test('Provides same-line content text for non-note tags', async () => {
		let resolvedContentLines: string[] | undefined

		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content tag variant',
			annotationCommentHandlers: [
				{
					tagNames: ['ins'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
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
					code: [
						// Ins tag content should reach the placement resolver unchanged
						'const one = 1',
						'// [!ins] X',
						'const two = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(resolvedContentLines).toEqual(['X'])
	})

	test('Supports rendering current-line content at line start', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content line start',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
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
					code: [
						// Current-line placement should prepend content at line start
						'const one = 1',
						'// [!note] Hello docs',
						'const two = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<div class="code"><span class="ac-content inline start"')
		expect(html).toContain('Hello docs</span>')
	})

	test('Anchors inline target placements to the matched inline range', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered inline target anchoring',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
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
					code: [
						// Inline search target should define anchor start and end columns
						'const one = 1',
						'// [!note:"children"] Hello docs',
						'  {children &&',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('ac-content line-before anchor-start')
		expect(html).toContain('--ecAnchorStart:3;--ecAnchorEnd:10;--ecContentCol:3')
	})

	test('Anchors annotation placements to the annotation column for standalone comments', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered annotation anchoring',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
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
					code: [
						// Standalone indented comment should anchor to its own column
						'<button',
						'  role="button"',
						'  {...props}',
						'        // [!note:0] Some label',
						'  value={value}',
						'>',
					].join('\n'),
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

	test('Keeps annotation anchor end below full line length on inline closing comments', async () => {
		const codeLine = `/* [!note:0] A */ console.log('This line will be marked as inserted');`

		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered annotation end anchoring',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
						render: {
							placement: {
								anchor: 'annotation',
								line: 'before',
								col: 'anchorEnd',
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
					code: codeLine,
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('ac-content line-before anchor-end')
		const anchorEndMatch = html.match(/--ecAnchorEnd:(\d+);/)
		const contentColumnMatch = html.match(/--ecContentCol:(\d+)/)
		expect(anchorEndMatch).toBeTruthy()
		expect(contentColumnMatch).toBeTruthy()
		const anchorEnd = Number(anchorEndMatch?.[1])
		const contentColumn = Number(contentColumnMatch?.[1])
		expect(anchorEnd).toBe(contentColumn)
		expect(anchorEnd).toBeLessThan(codeLine.length)
	})

	test('Excludes annotation comment text when resolving anchor end for line targets', async () => {
		const codeLine = "const code = 'Test: // [!demo-note] This looks like an annotation comment to the parser, but removing it would break the code';"
		const expectedAnchorEnd = Math.max(0, codeLine.slice(0, codeLine.indexOf('// [!demo-note]')).trimEnd().length - 1)
		expect(expectedAnchorEnd).toBeGreaterThan(0)

		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered annotation false-positive anchoring',
			annotationCommentHandlers: [
				{
					tagNames: ['demo-note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
						render: {
							placement: ({ targets }) => ({
								anchor: targets.length ? 'firstTarget' : 'annotation',
								line: 'before',
								col: 'anchorEnd',
							}),
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
					code: codeLine,
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		const anchorEndMatch = html.match(/--ecAnchorEnd:(\d+);/)
		expect(anchorEndMatch).toBeTruthy()
		const anchorEnd = Number(anchorEndMatch?.[1])
		expect(anchorEnd).toBe(expectedAnchorEnd)
	})

	test('Provides targets to content.render.placement resolver', async () => {
		let resolvedPrimaryTarget: { lineIndex: number; start: number; end: number } | undefined

		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered resolve context',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
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
					code: [
						// Placement resolver should receive inline target coordinates
						'const one = 1',
						'// [!note:"children"] Hello docs',
						'  {children &&',
					].join('\n'),
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

	test('Provides annotationLine to handler context', async () => {
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
					code: [
						// Verify render context values for a standalone annotation without targets
						'const one = 1',
						'        // [!note:0] no targets',
						'const two = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(annotationLineText).toBe('        // [!note:0] no targets')
	})

	test('Provides optional annotationTarget and resolved content render line/column to content renderer', async () => {
		let renderContextSummary:
			| {
					annotationTargetLine: number | undefined
					contentRenderLineText: string
					contentRenderColumn: number
			  }
			| undefined

		const plugin: ExpressiveCodePlugin = {
			name: 'Content render context',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
						render: {
							placement: {
								anchor: 'annotation',
								line: 'before',
								col: 'anchorStart',
							},
							contentRenderer: (context) => {
								renderContextSummary = {
									annotationTargetLine: context.annotationTarget?.lineIndex,
									contentRenderLineText: context.contentRenderLine.text,
									contentRenderColumn: context.contentRenderColumn,
								}
								return [{ type: 'text', value: context.content.text }]
							},
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
					code: [
						// Standalone annotation should expose undefined annotationTarget
						'const one = 1',
						'        // [!note:0] no targets',
						'const two = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(renderContextSummary).toEqual({
			annotationTargetLine: undefined,
			contentRenderLineText: '        // [!note:0] no targets',
			contentRenderColumn: 8,
		})
	})

	test('Allows custom content.render.contentWrapper functions to enrich content wrappers', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content wrapper enrichment',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
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
					code: [
						// Wrapper hook should enrich classes and flatten content text
						'const one = 1',
						'// [!note] 2',
						'const two = 2',
					].join('\n'),
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

	test('Allows custom content.render.contentWrapper functions to fully control wrapper children', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content wrapper replacement',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
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
					code: [
						// Wrapper hook should append custom children to default wrapper
						'const one = 1',
						'// [!note] X',
						'const two = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('(X)</span>')
		expect(html).toContain('<span class="ac-content inline start"')
	})

	test('Allows custom content.render.contentWrapper functions to replace the wrapper element', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content wrapper reassignment',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
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
					code: [
						// Wrapper hook should replace the default wrapper element
						'const one = 1',
						'// [!note] X',
						'const two = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<div class="tm-label">X</div>')
		expect(html).not.toContain('ac-content inline start')
	})

	test('Allows custom content.render.contentWrapper functions to retag and restyle the wrapper', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content wrapper retag',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
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
					code: [
						// Wrapper hook should retag wrapper and remove built-in style
						'const one = 1',
						'// [!note] X',
						'const two = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('<div class="tm-label">X</div>')
		expect(html).not.toContain('ac-content inline start')
	})

	test('Supports content.render.parentLine for generated between-lines hosts', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Rendered content line hook',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'remove',
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
					code: [
						// Parent-line hook should mark generated between-lines host rows
						'const one = 1',
						'// [!note] Hello docs',
						'const two = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		const html = toHtml(renderedBlockAst)
		expect(html).toContain('generated-content-line')
		expect(html).toContain('<div class="code"><div class="ac-content line-before start"')
	})

	test('Supports all anchor x line x col placement combinations', async () => {
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
					copyCode: 'remove',
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

	test('Supports render transforms that insert rendered lines', async () => {
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
					code: [
						// Render transform should inject a generated line before target
						'const one = 1',
						'// [!note]',
						'const two = 2',
					].join('\n'),
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

	test('Resolves render transform anchors by source line when mixed before and after inserts are registered', async () => {
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
					code: [
						// Before and after inserts should stay attached to each target line
						'const one = 1',
						'// [!note]',
						'const two = 2',
						'// [!note]',
						'const three = 3',
					].join('\n'),
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

	test('Logs annotation comment handler errors once per unique message with document context', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Failing handler',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					handle: () => {
						throw new Error('Expected failure')
					},
				},
			],
		}
		const warnings: string[] = []
		const engine = new ExpressiveCodeEngine({
			plugins: [plugin],
			logger: {
				warn: (message) => warnings.push(message),
				error: () => undefined,
			},
		})

		await expect(
			engine.render([
				{
					code: [
						// Repeated handler failures should be logged once per message
						'const one = 1',
						'// [!note] First',
						'const two = 2',
						'// [!note] Second',
						'const three = 3',
					].join('\n'),
					language: 'js',
					meta: '',
					parentDocument: {
						sourceFilePath: '/docs/example.mdx',
						positionInDocument: {
							groupIndex: 1,
							totalGroups: 4,
						},
					},
				},
			])
		).resolves.not.toThrow()

		expect(warnings).toHaveLength(1)
		expect(warnings[0]).toContain('document "/docs/example.mdx", code block 2/4')
		expect(warnings[0]).toContain('Failed to process annotation comment tag "note" handled by plugin "Failing handler": Expected failure')
		expect((warnings[0].match(/Failed to process annotation comment/g) || []).length).toBe(1)
	})

	test('Treats displayCode=remove with copyCode=keep as an invalid handler configuration', async () => {
		const plugin: ExpressiveCodePlugin = {
			name: 'Invalid copy cleanup',
			annotationCommentHandlers: [
				{
					tagNames: ['note'],
					content: {
						displayCode: 'remove',
						copyCode: 'keep',
					},
					handle: ({ targets }) => {
						targets.forEach((target) => {
							target.line.addAnnotation(new WrapperAnnotation({ selector: 'mark' }))
						})
					},
				},
			],
		}
		const warnings: string[] = []
		const engine = new ExpressiveCodeEngine({
			plugins: [plugin],
			logger: {
				warn: (message) => warnings.push(message),
				error: () => undefined,
			},
		})

		const { renderedGroupContents } = await engine.render([
			{
				code: [
					// Invalid cleanup configuration should warn and keep original line
					'const one = 1',
					'// [!note] invalid config',
					'const two = 2',
				].join('\n'),
				language: 'js',
				meta: '',
			},
		])

		expect(warnings).toHaveLength(1)
		expect(warnings[0]).toContain('Failed to process annotation comment tag "note" handled by plugin "Invalid copy cleanup"')
		expect(warnings[0]).toContain('content.copyCode="keep" with content.displayCode="remove"')
		expect(renderedGroupContents[0].codeBlock.code).toContain('// [!note] invalid config')
		const html = toSanitizedHtml(renderedGroupContents[0].renderedBlockAst)
		expect(html).not.toContain('<mark>')
	})
})

describe('Annotation comment copy transforms', () => {
	test('Are applied by codeBlock.getCopyText', async () => {
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
					code: [
						// Del tag should remove the targeted source line from copy text
						'const keep = 1',
						'// [!del]',
						'const remove = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(codeBlock.code).toEqual(['const keep = 1', 'const remove = 2'].join('\n'))
		expect(codeBlock.getCopyText()).toEqual('const keep = 1')
	})

	test('Discards edit transforms after the same source line was removed', async () => {
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
					code: [
						// Edit transforms should be discarded after removing their line
						'const keep = 1',
						'// [!del]',
						'const remove = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(codeBlock.getCopyText()).toEqual('const keep = 1')
	})

	test('Supports content.copyCode convenience cleanup', async () => {
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
					code: [
						// Copy cleanup should drop note content while display code stays
						'const keep = 1',
						'// [!note] Remove me from copied text',
						'const stay = 2',
					].join('\n'),
					language: 'js',
					meta: '',
				},
			],
		})

		expect(codeBlock.code).toEqual(['const keep = 1', '// Remove me from copied text', 'const stay = 2'].join('\n'))
		expect(codeBlock.getCopyText()).toEqual(['const keep = 1', 'const stay = 2'].join('\n'))
	})
})
