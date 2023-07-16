/**
 * Workaround code for cases in which the Clipboard API is not available.
 */
const domCopy = [
	// Define copy function
	`function domCopy(text) {`,
	// Create a new DOM element to copy from and append it to the document,
	// but make sure it's not visible and does not cause reflow
	`let n = document.createElement('pre');
	Object.assign(n.style, {
		opacity: '0',
		pointerEvents: 'none',
		position: 'absolute',
		overflow: 'hidden',
		left: '0',
		top: '0',
		width: '20px',
		height: '20px',
		webkitUserSelect: 'auto',
		userSelect: 'all'
	});
	n.ariaHidden = 'true';
	n.textContent = text;
	document.body.appendChild(n);`,
	// Select the DOM element's contents
	`let r = document.createRange();
	r.selectNode(n);
	let s = getSelection();
	s.removeAllRanges();
	s.addRange(r);`,
	// Copy the selection to the clipboard
	`let ok = false;
	try {
		ok = document.execCommand('copy');
	} finally {
		s.removeAllRanges();
		document.body.removeChild(n);
	}
	return ok;`,
	// End of function body
	`}`,
]

/**
 * Function to handle clicks on a single copy button.
 */
const clickHandler = [
	// Define click handler function
	`async function clickHandler(event) {`,
	// Attempt to perform copy operation, first using the Clipboard API,
	// and then falling back to a DOM-based approach
	`let btn = event.currentTarget;
	let ok = false;
	let code = btn.dataset.code.replace(/\\u007f/g, '\\n');
	try {
		await navigator.clipboard.writeText(code);
		ok = true;
	} catch (err) {
		ok = domCopy(code);
	}`,
	// Exit if the copy operation failed or there is already a tooltip present
	`if (!ok || btn.parentNode.querySelector('.feedback')) return;`,
	// Show feedback tooltip
	`let tt = document.createElement('div');
	tt.classList.add('feedback');
	tt.append(btn.dataset.copied);
	btn.before(tt);`,
	// Use offsetWidth and requestAnimationFrame to opt out of DOM batching,
	// which helps to ensure that the transition on 'show' works
	`tt.offsetWidth;
	requestAnimationFrame(() => tt.classList.add('show'));`,
	// Hide & remove the tooltip again when we no longer need it
	`let h = () => !tt || tt.classList.remove('show');
	let r = () => {
		if (!(!tt || parseFloat(getComputedStyle(tt).opacity) > 0)) {
			tt.remove();
			tt = null;
		}
	};
	setTimeout(h, 1500);
	setTimeout(r, 2500);
	btn.addEventListener('blur', h);
	tt.addEventListener('transitioncancel', r);
	tt.addEventListener('transitionend', r);`,
	// End of function body
	`}`,
]

/**
 * Code to initialize all copy buttons on the page.
 *
 * It first attaches the click handler to all buttons that exist on the page right now,
 * and then registers a MutationObserver that handles any new buttons added later
 * (e.g. when the page dynamically loads more content or replaces existing content).
 */
const attachHandlers = [
	// Define a function that searches a node for matching buttons and initializes them
	// unless the node does not support querySelectorAll (e.g. a text node)
	`let initButtons = n => !n.querySelectorAll || n.querySelectorAll('[SELECTOR]').forEach(btn =>
		btn.addEventListener('click', clickHandler)
	);`,
	// Use the function to initialize all buttons that exist right now
	`initButtons(document);`,
	// Register a MutationObserver to initialize any new buttons added later
	`let obs = new MutationObserver(ms =>
		ms.forEach(m =>
			m.addedNodes.forEach(n =>
				initButtons(n)
			)
		)
	);
	obs.observe(document.body, { childList: true, subtree: true });`,
]

export const getCopyJsModule = (buttonSelector: string) => {
	return [...domCopy, ...clickHandler, ...attachHandlers]
		.map((line) =>
			line
				.trim()
				.replace(/\s*[\r\n]\s*/g, '')
				.replace(/\s*([:;,={}()<>])\s*/g, '$1')
				.replace(/;}/g, '}')
		)
		.join('')
		.replace(/\[SELECTOR\]/g, buttonSelector)
}
