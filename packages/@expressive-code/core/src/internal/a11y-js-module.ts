import { getStableObjectHash } from '../helpers/objects'

/**
 * Updates accessibility attributes of a code block's `pre` element
 * based on whether it's horizontally scrollable.
 *
 * Adds keyboard focus and screen reader support when scrollable,
 * removes them when not scrollable.
 */
function updateAccessibility(el: Element) {
	if (!el) return

	const isFocusable = el.getAttribute('tabindex') !== null
	const isScrollable = el.scrollWidth > el.clientWidth

	if (isScrollable && !isFocusable) {
		// Generate id for the label
		const labelId = `ec-label-${getStableObjectHash(el.innerHTML)}`

		// Create a screen reader only label
		const label = document.createElement('span')
		label.id = labelId
		label.className = 'sr-only'
		label.textContent = 'Horizontally scrollable code'
		el.appendChild(label)

		// Add label and accessibility attributes
		el.setAttribute('tabindex', '0')
		el.setAttribute('role', 'group')
		el.setAttribute('aria-labelledby', labelId)
	} else if (!isScrollable && isFocusable) {
		// Get the label id before removing accessibility attributes
		const labelId = el.getAttribute('aria-labelledby')

		// Remove accessibility attributes
		el.removeAttribute('tabindex')
		el.removeAttribute('role')
		el.removeAttribute('aria-labelledby')

		// Remove the label element
		if (labelId) {
			const existingLabel = el.querySelector(`#${labelId}`)
			if (existingLabel) {
				existingLabel.remove()
			}
		}
	}
}

/**
 * `requestIdleCallback` which falls back to `setTimeout` in older browsers.
 */
const onIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1))
/**
 * `cancelIdleCallback` which falls back to `clearTimeout` in older browsers.
 */
const cancelIdle = window.cancelIdleCallback || clearTimeout

/**
 * Creates a debounced resize observer that calls `elementResizedFn`
 * on observed elements when the main thread is idle.
 */
function debouncedResizeObserver(elementResizedFn: (el: Element) => void) {
	const elementsToUpdate = new Set<Element>()
	let updateTimeout: ReturnType<typeof setTimeout> | undefined
	let taskId: number | undefined
	const resizeObserver = new ResizeObserver((entries) => {
		entries.forEach((entry) => elementsToUpdate.add(entry.target))
		if (updateTimeout) clearTimeout(updateTimeout)
		if (taskId) cancelIdle(taskId)
		updateTimeout = setTimeout(() => {
			if (taskId) cancelIdle(taskId)
			taskId = onIdle(() => {
				elementsToUpdate.forEach((el) => elementResizedFn(el))
				elementsToUpdate.clear()
			})
		}, 250)
	})
	return resizeObserver
}

/**
 * Searches a node for `pre` elements inside an Expressive Code wrapper,
 * calls `updateAccessibility` on them immediately and observes future resizes.
 */
function initCodeBlocks(container: ParentNode | Document, resizeObserver: ResizeObserver) {
	container.querySelectorAll?.('.expressive-code pre > code').forEach((code) => {
		const pre = code.parentElement
		if (!pre) return
		resizeObserver.observe(pre)
	})
}

// Register a debounced resize observer that updates accessibility attributes
const resizeObserver = debouncedResizeObserver(updateAccessibility)

// Initialize all code blocks that exist right now
initCodeBlocks(document, resizeObserver)

// Register a MutationObserver to initialize any new code blocks added later
const mutationObserver = new MutationObserver((mutations) =>
	mutations.forEach((mutation) =>
		mutation.addedNodes.forEach((node) => {
			initCodeBlocks(node as ParentNode, resizeObserver)
		})
	)
)
mutationObserver.observe(document.body, { childList: true, subtree: true })

// Also re-initialize all code blocks after view transitions initiated by popular frameworks
document.addEventListener('astro:page-load', () => {
	initCodeBlocks(document, resizeObserver)
})
