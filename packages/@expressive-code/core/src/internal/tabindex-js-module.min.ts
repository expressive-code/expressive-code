/*
	GENERATED FILE - DO NOT EDIT
	----------------------------
	This JS module code was built from the source file "tabindex-js-module.ts".
	To change it, modify the source file and then re-run the build script.
*/

export default 'try{(()=>{function i(e){if(!e)return;let r=e.getAttribute("tabindex")!==null,t=e.scrollWidth>e.clientWidth;t&&!r?e.setAttribute("tabindex","0"):!t&&r&&e.removeAttribute("tabindex")}function a(e){let r=new Set,t;return new ResizeObserver(u=>{u.forEach(o=>r.add(o.target)),t&&clearTimeout(t),t=setTimeout(()=>{t=void 0,r.forEach(o=>e(o)),r.clear()},250)})}function s(e,r){e.querySelectorAll?.(".expressive-code pre > code").forEach(t=>{let n=t.parentElement;n&&(i(n),r.observe(n))})}var d=a(i);s(document,d);var c=new MutationObserver(e=>e.forEach(r=>r.addedNodes.forEach(t=>{s(t,d)})));c.observe(document.body,{childList:!0,subtree:!0});document.addEventListener("astro:page-load",()=>{s(document,d)});})();}catch(e){console.error("[EC] tabindex-js-module failed:",e)}'
