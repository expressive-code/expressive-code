// @ts-check
/** @type {NonNullable<import('astro-expressive-code').PluginShikiOptions['langs']>[number]} */
const lang = [
	{
		name: 'test-language',
		scopeName: 'source.test-language',
		displayName: 'test syntax',
		patterns: [
			{
				name: 'keyword.test-language',
				match: `\\b(test|const)\\b`,
			},
			{
				name: 'entity.name.tag.test-language',
				match: `\\b(my)\\b`,
			},
			{
				name: 'comment.block.test-language',
				begin: '"',
				end: '"',
			},
		],
	},
]
export default lang
