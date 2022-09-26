import { describe, test } from 'vitest'
import { createHighlighter, expectHtmlSnapshotMatch, getAnnotationResult } from './utils'

const codeSnippet = `
interface PropsType {
  children: JSX.Element
  name: string
}

class Component extends React.Component<PropsType, {}> {
  render() {
    return (
      <h2>
        {this.props.children}
      </h2>
    )
  }
}

<Component name="foo">
  <h1>Hello World</h1>
</Component>
`

describe('Color contrast', () => {
	test('Lightens tokens in marked lines', async () => {
		const highlighter = await createHighlighter({
			theme: 'material-default',
		})

		const annotationResult = getAnnotationResult(codeSnippet, {
			lang: 'tsx',
			highlighter,
			annotations: {
				lineMarkings: [{ lines: [2, 7] }],
			},
		})

		expectHtmlSnapshotMatch({ annotationResult, name: 'lightens-tokens-in-marked-lines' })
	})
})

// TODO: Add color contrast tests, including cases where color must be inverted, and where contrast cannot be improved
