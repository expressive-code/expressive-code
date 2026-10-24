/*
	GENERATED FILE - DO NOT EDIT
	----------------------------
	This JS module code was built from the source file "tabindex-js-module.ts".
	To change it, modify the source file and then re-run the build script.
*/

export default 'try{(()=>{function c(e){if(!e)return;let r=e.getAttribute("tabindex")!==null,n=e.scrollWidth>e.clientWidth;if(n&&!r){e.setAttribute("tabindex","0"),e.setAttribute("role","group");let t=e.getAttribute("data-scroll-label");t&&e.setAttribute("aria-label",t)}else!n&&r&&(e.removeAttribute("tabindex"),e.removeAttribute("role"),e.removeAttribute("aria-label"))}var u=window.requestIdleCallback||(e=>setTimeout(e,1)),a=window.cancelIdleCallback||clearTimeout;function l(e){let r=new Set,n,t;return new ResizeObserver(d=>{d.forEach(o=>r.add(o.target)),n&&clearTimeout(n),t&&a(t),n=setTimeout(()=>{t&&a(t),t=u(()=>{r.forEach(o=>e(o)),r.clear()})},250)})}function i(e,r){e.querySelectorAll?.(".expressive-code pre > code").forEach(n=>{let t=n.parentElement;t&&r.observe(t)})}var s=l(c);i(document,s);var b=new MutationObserver(e=>e.forEach(r=>r.addedNodes.forEach(n=>{i(n,s)})));b.observe(document.body,{childList:!0,subtree:!0});document.addEventListener("astro:page-load",()=>{i(document,s)});})();}catch(e){console.error("[EC] tabindex-js-module failed:",e)}'
