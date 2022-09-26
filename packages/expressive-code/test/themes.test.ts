import { describe, test } from 'vitest'
import { createHighlighter, expectHtmlSnapshotMatch, getAnnotationResult } from './utils'

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

describe('Color contrast', () => {
	test('Lightens tokens in marked lines', async () => {
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

		expectHtmlSnapshotMatch({ annotationResult, name: 'lightens-tokens-in-marked-lines' })
	})
})

// TODO: Add color contrast tests, including cases where color must be inverted, and where contrast cannot be improved
