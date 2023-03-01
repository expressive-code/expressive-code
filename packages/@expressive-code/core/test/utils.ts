import { expect } from 'vitest'

const nothings = [undefined, null, NaN]
const booleans = [true, false]
const strings = ['', 'true', 'false', '0', '1']
const numbers = [0, 1]

export const nonStringValues = [...nothings, ...booleans, ...numbers, {}, []]
export const nonNumberValues = [...nothings, ...booleans, ...strings, {}, []]
export const nonArrayValues = [...nothings, ...booleans, ...numbers, ...strings, {}]
export const nonObjectValues = [...nothings, ...booleans, ...numbers, ...strings, []]

export function expectToWorkOrThrow(shouldWork: boolean, testFunc: () => void) {
	if (shouldWork) return expect(testFunc).not.toThrow()
	return expect(testFunc).toThrow()
}
