/* eslint-disable @typescript-eslint/no-misused-promises */

/**
 * Fallback approach to copy text to the clipboard in case the Clipboard API is not available.
 */
function domCopy(text: string) {
	// Create a new DOM element to copy from and append it to the document,
	// but make sure it's not visible and does not cause reflow
	const pre = document.createElement('pre')
	Object.assign(pre.style, {
		opacity: '0',
		pointerEvents: 'none',
		position: 'absolute',
		overflow: 'hidden',
		left: '0',
		top: '0',
		width: '20px',
		height: '20px',
		webkitUserSelect: 'auto',
		userSelect: 'all',
	})
	pre.ariaHidden = 'true'
	pre.textContent = text
	document.body.appendChild(pre)

	// Select the DOM element's contents
	const range = document.createRange()
	range.selectNode(pre)
	const selection = getSelection()
	if (!selection) return false
	selection.removeAllRanges()
	selection.addRange(range)

	// Copy the selection to the clipboard
	let ok = false
	try {
		// Although this is a deprecated API, it is still the only way to copy in some browsers
		// eslint-disable-next-line deprecation/deprecation
		ok = document.execCommand('copy')
	} finally {
		selection.removeAllRanges()
		document.body.removeChild(pre)
	}
	return ok
}

/**
 * Handles clicks on a single copy button.
 */
async function clickHandler(event: Event) {
	// Attempt to perform the copy operation, first using the Clipboard API,
	// and then falling back to a DOM-based approach
	const button = event.currentTarget as HTMLButtonElement
	const dataset = button.dataset as { code: string; copied: string }
	let ok = false
	const code = dataset.code.replace(/\u007f/g, '\n')
	try {
		await navigator.clipboard.writeText(code)
		ok = true
	} catch (err) {
		ok = domCopy(code)
	}

	// Exit if the copy operation failed or there is already a tooltip present
	if (!ok || button.parentNode?.querySelector('.feedback')) return

	// Show feedback tooltip
	const liveRegion = button.parentElement?.querySelector('[aria-live]') as HTMLDivElement
	let tooltip: HTMLDivElement | undefined = document.createElement('div')
	tooltip.classList.add('feedback')
	tooltip.append(dataset.copied)
	liveRegion.append(tooltip)

	// Use offsetWidth and requestAnimationFrame to opt out of DOM batching,
	// which helps to ensure that the transition on 'show' works
	tooltip.offsetWidth
	requestAnimationFrame(() => tooltip?.classList.add('show'))

	// Hide & remove the tooltip again when we no longer need it
	const hideTooltip = () => !tooltip || tooltip.classList.remove('show')
	const removeTooltip = () => {
		if (!(!tooltip || parseFloat(getComputedStyle(tooltip).opacity) > 0)) {
			tooltip.remove()
			tooltip = undefined
		}
	}
	setTimeout(hideTooltip, 1500)
	setTimeout(removeTooltip, 2500)
	button.addEventListener('blur', hideTooltip)
	tooltip.addEventListener('transitioncancel', removeTooltip)
	tooltip.addEventListener('transitionend', removeTooltip)
}

/**
 * Searches a node for matching buttons and initializes them
 * unless the node does not support querySelectorAll (e.g. a text node).
 */
function initButtons(container: ParentNode | Document) {
	container.querySelectorAll?.('[SELECTOR]').forEach((btn) => btn.addEventListener('click', clickHandler))
}

// Use the function to initialize all buttons that exist right now
initButtons(document)

// Register a MutationObserver to initialize any new buttons added later
const newButtonsObserver = new MutationObserver((mutations) =>
	mutations.forEach((mutation) =>
		mutation.addedNodes.forEach((node) => {
			initButtons(node as ParentNode)
		})
	)
)
newButtonsObserver.observe(document.body, { childList: true, subtree: true })

// Also re-initialize all buttons after view transitions initiated by popular frameworks
document.addEventListener('astro:page-load', () => {
	initButtons(document)
})
