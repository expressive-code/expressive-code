import { beforeAll, describe, expect, test } from 'vitest'
import { addPrettierHtmlSnapshotSerializer, getAnnotationResult } from './utils'

const codeSnippet = `
---
import MyReactComponent from '../components/MyReactComponent.jsx';
import MyAstroComponent from '../components/MyAstroComponent.astro';
---

<MyReactComponent>
	<MyAstroComponent slot="name" />
</MyReactComponent>
`

beforeAll(() => {
	addPrettierHtmlSnapshotSerializer()
})

describe('Color contrast', () => {
	test('Lightens tokens inside marked lines', () => {
		const annotationResult = getAnnotationResult(codeSnippet, {
			annotations: {
				lineMarkings: [{ lines: [2, 7] }],
			},
		})

		expect(annotationResult.annotatedCodeHtml).toMatchSnapshot()
	})
})

// TODO: Add color contrast tests, including cases where color must be inverted, and where contrast cannot be improved
