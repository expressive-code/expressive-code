import { execFileSync } from 'node:child_process'
import { describe, expect, test } from 'vitest'

function resolveLoader(conditions: string[] = []) {
	return execFileSync(
		process.execPath,
		[
			...conditions.map((condition) => `--conditions=${condition}`),
			'--input-type=module',
			'--eval',
			`const { loadOnigurumaWasm } = await import('#oniguruma-wasm'); process.stdout.write(loadOnigurumaWasm.toString())`,
		],
		{ cwd: new URL('..', import.meta.url), encoding: 'utf8' }
	)
}

describe('Oniguruma WASM loading', () => {
	test('uses the Shiki WASM loader by default', () => {
		expect(resolveLoader()).toContain('shiki/wasm')
	})

	test('uses the workerd-compatible WASM import under the workerd condition', () => {
		expect(resolveLoader(['workerd'])).toContain('shiki/onig.wasm')
	})
})
