/*
	GENERATED FILE - DO NOT EDIT
	----------------------------
	This JS module code was built from the source file "tabindex-js-module.ts".
	To change it, modify the source file and then re-run the build script.
*/

export default 'try{(()=>{function a(e){if(!e)return;let t=e.getAttribute("tabindex")!==null,n=e.scrollWidth>e.clientWidth;n&&!t?e.setAttribute("tabindex","0"):!n&&t&&e.removeAttribute("tabindex")}var u=window.requestIdleCallback||(e=>setTimeout(e,1)),i=window.cancelIdleCallback||clearTimeout;function l(e){let t=new Set,n,r;return new ResizeObserver(c=>{c.forEach(o=>t.add(o.target)),n&&clearTimeout(n),r&&i(r),n=setTimeout(()=>{r&&i(r),r=u(()=>{t.forEach(o=>e(o)),t.clear()})},250)})}function d(e,t){e.querySelectorAll?.(".expressive-code pre > code").forEach(n=>{let r=n.parentElement;r&&t.observe(r)})}var s=l(a);d(document,s);var b=new MutationObserver(e=>e.forEach(t=>t.addedNodes.forEach(n=>{d(n,s)})));b.observe(document.body,{childList:!0,subtree:!0});document.addEventListener("astro:page-load",()=>{d(document,s)});})();}catch(e){console.error("[EC] tabindex-js-module failed:",e)}'
