import { beforeAll, describe, expect, test } from 'vitest'
import { addPrettierHtmlSnapshotSerializer, createHighlighter, getAnnotationResult } from './utils'

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

beforeAll(() => {
	addPrettierHtmlSnapshotSerializer()
})

describe('Color contrast', () => {
	test('Lightens tokens inside marked lines', async () => {
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

		expect(annotationResult.annotatedCodeHtml).toMatchSnapshot()
	})
})

// TODO: Add color contrast tests, including cases where color must be inverted, and where contrast cannot be improved
