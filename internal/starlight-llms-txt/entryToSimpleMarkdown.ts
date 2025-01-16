import mdxServer from '@astrojs/mdx/server.js';
import type { APIContext } from 'astro';
import { experimental_AstroContainer } from 'astro/container';
import { render, type CollectionEntry } from 'astro:content';
import type { RootContent } from 'hast';
import { matches, select, selectAll } from 'hast-util-select';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { remove } from 'unist-util-remove';
import { starlightLllmsTxtContext } from 'virtual:starlight-llms-txt/context';

/** Minification defaults */
const minifyDefaults = {
	note: true,
	tip: true,
	caution: false,
	danger: false,
	details: true,
	whitespace: true,
	customSelectors: [],
};
/** Resolved minification options */
const minify = { ...minifyDefaults, ...starlightLllmsTxtContext.minify };
/** Selectors for elements to remove during minification. */
const selectors = [...minify.customSelectors];
if (minify.details) selectors.unshift('details');

const astroContainer = await experimental_AstroContainer.create({
	renderers: [{ name: 'astro:jsx', ssr: mdxServer }],
});

const htmlToMarkdownPipeline = unified()
	.use(rehypeParse, { fragment: true })
	.use(function minifyLlmsTxt() {
		return (tree, file) => {
			if (!file.data.starlightLlmsTxt.minify) {
				return;
			}
			remove(tree, (_node) => {
				const node = _node as RootContent;

				// Remove elements matching any selectors to be minified:
				for (const selector of selectors) {
					if (matches(selector, node)) {
						return true;
					}
				}

				// Remove aside components:
				if (matches('.starlight-aside', node)) {
					for (const variant of ['note', 'tip', 'caution', 'danger'] as const) {
						if (minify[variant] && matches(`.starlight-aside--${variant}`, node)) {
							return true;
						}
					}
				}

				return false;
			});
			return tree;
		};
	})
	.use(function improveExpressiveCodeHandling() {
		return (tree) => {
			const ecInstances = selectAll('.expressive-code', tree as Parameters<typeof selectAll>[1]);
			for (const instance of ecInstances) {
				// Remove the “Terminal Window” label from Expressive Code terminal frames.
				const figcaption = select('figcaption', instance);
				if (figcaption) {
					const terminalWindowTextIndex = figcaption.children.findIndex((child) =>
						matches('span.sr-only', child)
					);
					if (terminalWindowTextIndex > -1) {
						figcaption.children.splice(terminalWindowTextIndex, 1);
					}
				}
				const pre = select('pre', instance);
				const code = select('code', instance);
				// Use Expressive Code’s `data-language=*` attribute to set a `language-*` class name.
				// This is what `hast-util-to-mdast` checks for code language metadata.
				if (pre?.properties.dataLanguage && code) {
					if (!Array.isArray(code.properties.className)) code.properties.className = [];
					code.properties.className.push(`language-${pre.properties.dataLanguage}`);
				}
			}
		};
	})
	.use(function improveTabsHandling() {
		return (tree) => {
			const tabInstances = selectAll('starlight-tabs', tree as Parameters<typeof selectAll>[1]);
			for (const instance of tabInstances) {
				const tabs = selectAll('[role="tab"]', instance);
				const panels = selectAll('[role="tabpanel"]', instance);
				// Convert parent `<starlight-tabs>` element to empty unordered list.
				instance.tagName = 'ul';
				instance.properties = {};
				instance.children = [];
				// Iterate over tabs and panels to build a list with tab label as initial list text.
				for (let i = 0; i < Math.min(tabs.length, panels.length); i++) {
					const tab = tabs[i];
					const panel = panels[i];
					if (!tab || !panel) continue;
					// Filter out extra whitespace and icons from tab contents.
					const tabLabel = tab.children
						.filter((child) => child.type === 'text' && child.value.trim())
						.map((child) => child.type === 'text' && child.value.trim())
						.join('');
					// Add list entry for this tab and panel.
					instance.children.push({
						type: 'element',
						tagName: 'li',
						properties: {},
						children: [
							{
								type: 'element',
								tagName: 'p',
								children: [{ type: 'text', value: tabLabel }],
								properties: {},
							},
							panel,
						],
					});
				}
			}
		};
	})
	.use(rehypeRemark)
	.use(remarkGfm)
	.use(remarkStringify);

/** Render a content collection entry to HTML and back to Markdown to support rendering and simplifying MDX components */
export async function entryToSimpleMarkdown(
	entry: CollectionEntry<'docs'>,
	context: APIContext,
	shouldMinify: boolean = false
) {
	const { Content } = await render(entry);
	const html = await astroContainer.renderToString(Content, context);
	const file = await htmlToMarkdownPipeline.process({
		value: html,
		data: { starlightLlmsTxt: { minify: shouldMinify } },
	});
	let markdown = String(file).trim();
	if (shouldMinify && minify.whitespace) {
		markdown = markdown.replace(/\s+/g, ' ');
	}
	return markdown;
}
