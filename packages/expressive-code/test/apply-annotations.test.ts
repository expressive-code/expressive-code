import { describe, expect, test } from 'vitest'
import { applyAnnotations } from '../src/index'

describe('Does not fail if there is nothing to do', () => {
	test('No annotations', () => {
		expect(
			applyAnnotations(``, {
				lang: 'js',
				annotations: {},
			})
		).toBe(``)
	})
})
