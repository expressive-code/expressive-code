/**
 * Updates the `tabindex` attribute of a code block's `pre` element
 * based on whether the code block is scrollable.
 */
function updateTabIndex(el: Element) {
	if (!el) return
	const hasTabIndex = el.getAttribute('tabindex') !== null
	const needsTabIndex = el.scrollWidth > el.clientWidth
	if (needsTabIndex && !hasTabIndex) {
		el.setAttribute('tabindex', '0')
		el.setAttribute('role', 'region')
	} else if (!needsTabIndex && hasTabIndex) {
		el.removeAttribute('tabindex')
		el.removeAttribute('role')
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
 * calls `updateTabIndex` on them immediately and observes future resizes.
 */
function initCodeBlocks(container: ParentNode | Document, resizeObserver: ResizeObserver) {
	container.querySelectorAll?.('.expressive-code pre > code').forEach((code) => {
		const pre = code.parentElement
		if (!pre) return
		resizeObserver.observe(pre)
	})
}

// Register a debounced resize observer that updates the `tabindex` attribute
const resizeObserver = debouncedResizeObserver(updateTabIndex)

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
