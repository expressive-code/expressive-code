// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import tabindexJsModule from '../src/internal/tabindex-js-module.min'

describe('Scrollable code block JS module', () => {
	let resizeObserverCallback: ResizeObserverCallback | undefined

	beforeEach(() => {
		vi.useFakeTimers()
		vi.stubGlobal(
			'ResizeObserver',
			class {
				observe = vi.fn()
				unobserve = vi.fn()
				disconnect = vi.fn()
				constructor(callback: ResizeObserverCallback) {
					resizeObserverCallback = callback
				}
			}
		)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.useRealTimers()
		document.body.innerHTML = ''
	})

	function renderCodeBlockAndRunModule() {
		document.body.innerHTML = '<div class="expressive-code"><pre data-language="js" data-scroll-label="Scrollable code"><code><div>const a = 1</div></code></pre></div>'
		// Run the minified module code exactly as it is shipped to the browser
		const script = document.createElement('script')
		script.textContent = tabindexJsModule
		document.body.append(script)
		return document.querySelector('pre')!
	}

	async function resizeCodeBlock(pre: HTMLElement, { scrollWidth, clientWidth }: { scrollWidth: number; clientWidth: number }) {
		Object.defineProperty(pre, 'scrollWidth', { configurable: true, get: () => scrollWidth })
		Object.defineProperty(pre, 'clientWidth', { configurable: true, get: () => clientWidth })
		resizeObserverCallback!([{ target: pre } as unknown as ResizeObserverEntry], {} as ResizeObserver)
		// Wait for the debounced update to run
		await vi.advanceTimersByTimeAsync(500)
	}

	function getA11yAttributes(pre: HTMLElement) {
		return {
			tabindex: pre.getAttribute('tabindex'),
			role: pre.getAttribute('role'),
			ariaLabel: pre.getAttribute('aria-label'),
		}
	}

	test('Makes scrollable code blocks focusable and gives them an accessible name', async () => {
		const pre = renderCodeBlockAndRunModule()
		await resizeCodeBlock(pre, { scrollWidth: 800, clientWidth: 300 })
		expect(getA11yAttributes(pre)).toEqual({ tabindex: '0', role: 'group', ariaLabel: 'Scrollable code' })
	})

	test('Removes the name together with the role when the code block stops scrolling', async () => {
		const pre = renderCodeBlockAndRunModule()
		await resizeCodeBlock(pre, { scrollWidth: 800, clientWidth: 300 })
		await resizeCodeBlock(pre, { scrollWidth: 300, clientWidth: 300 })
		expect(getA11yAttributes(pre)).toEqual({ tabindex: null, role: null, ariaLabel: null })
	})

	test('Leaves code blocks that fit untouched', async () => {
		const pre = renderCodeBlockAndRunModule()
		await resizeCodeBlock(pre, { scrollWidth: 300, clientWidth: 300 })
		expect(getA11yAttributes(pre)).toEqual({ tabindex: null, role: null, ariaLabel: null })
	})
})
