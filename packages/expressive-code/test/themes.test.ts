import chroma from 'chroma-js'
import { describe, test, expect } from 'vitest'
import { createHighlighter, prepareHtmlSnapshot, getAnnotationResult } from './utils'

const jsxCodeSnippet = `
interface PropsType {
  children: JSX.Element
  name: string
}

class Component extends React.Component<PropsType, {}> {
  render() {
    // Wrap some custom HTML around the given children
    return (
      <article title={\`Found \${this.props.children.length} children\`}>
        <div>{this.props.children}</div>
      </article>
    )
  }
}

<Component name="foo">
  {/* This is a JSX comment */}
  <h1>Hello World</h1>
</Component>
`

describe('Color contrast in marked lines', () => {
	test('Lightens tokens where text is lighter than background', async () => {
		const highlighter = await createHighlighter({
			theme: 'material-default',
		})

		const annotationResult = getAnnotationResult(jsxCodeSnippet, {
			lang: 'tsx',
			highlighter,
			annotations: {
				lineMarkings: [{ lines: [2] }, { markerType: 'ins', lines: [10] }],
			},
		})

		const snapshot = prepareHtmlSnapshot({ annotationResult, name: 'low-contrast-light-text' })

		// Get the opening and closing `article` tags and their colors
		const htmlTagTokens = snapshot.actual.annotatedCode.shikiTokens.filter((token) => token.text === 'article')
		expect(htmlTagTokens).toHaveLength(2)
		const openingTagColor = chroma(htmlTagTokens[0].color || '')
		const closingTagColor = chroma(htmlTagTokens[1].color || '')

		// Expect the (inserted) opening tag to be lighter than the (regular) closing tag
		expect(openingTagColor.luminance()).toBeGreaterThan(closingTagColor.luminance())
	})
})

// TODO: Add color contrast tests, including cases where color must be inverted, and where contrast cannot be improved
