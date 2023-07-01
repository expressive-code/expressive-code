/**
 * Workaround code for cases in which the Clipboard API is not available.
 */
const domCopy = [
	// Start of function
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
	// End of function
	`}`,
]

/**
 * Code to handle clicks on the copy buttons.
 */
const handleClicks = [
	// Start of loop through all buttons that adds a click handler per button
	`document.querySelectorAll('[SELECTOR]').forEach((button) =>
		button.addEventListener('click', async () => {`,
	// Click handler code
	`let ok = false;
	let code = button.dataset.code.replace(/\\u007f/g, '\\n');
	try {
		await navigator.clipboard.writeText(code);
		ok = true;
	} catch (err) {
		ok = domCopy(code);
	}`,
	// Show feedback tooltip
	`if (ok && (!button.nextSibling || !button.nextSibling.classList.contains('feedback'))) {
		let tt = document.createElement('div');
		tt.classList.add('feedback');
		tt.append(button.dataset.copied);
		button.after(tt);`,
	// Use offsetWidth and requestAnimationFrame to opt out of DOM batching,
	// which helps to ensure that the transition on 'show' works
	`	tt.offsetWidth;
		requestAnimationFrame(() => tt.classList.add('show'));`,
	// Hide & remove the tooltip again when we no longer need it
	`	let h = () => !tt || tt.classList.remove('show');
		let r = () => {
			if (!(!tt || parseFloat(getComputedStyle(tt).opacity) > 0)) {
				tt.remove();
				tt = null;
			}
		};
		setTimeout(h, 1500);
		setTimeout(r, 2500);
		button.addEventListener('blur', h);
		tt.addEventListener('transitioncancel', r);
		tt.addEventListener('transitionend', r);
	}`,
	// End of loop through all buttons
	`}))`,
]

export const getCopyJsModule = (buttonSelector: string) => {
	return [...domCopy, ...handleClicks]
		.map((line) =>
			line
				.trim()
				.replace(/\s*[\r\n]\s*/g, '')
				.replace(/\s*([:;,={}()<>])\s*/g, '$1')
				.replace(/;}/g, '}')
		)
		.join('')
		.replace('[SELECTOR]', buttonSelector)
}
