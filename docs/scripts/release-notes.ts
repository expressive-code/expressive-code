import { toMarkdown } from 'mdast-util-to-markdown'
import type { List, Root } from 'mdast'
import { getPackageChangelogs, loadChangelog, mergeIncludes, semverCategories } from './lib/changelogs'
import { writeFileLines } from './typedoc/utils'

// Find changelog paths on disk
const changelogPaths = [
	// Non-scoped packages
	...getPackageChangelogs('../packages'),
	// Scoped packages
	...getPackageChangelogs('../packages/@expressive-code'),
]

const nonDefaultPackages = [
	// All packages that are not included by default
	'@expressive-code/plugin-collapsible-sections',
]

// Load all changelogs
const changelogs = changelogPaths.map((path) => loadChangelog(path))

// Use the changelog of `astro-expressive-code` as the main changelog
const combinedChangelog = changelogs.find((changelog) => changelog.packageName === 'astro-expressive-code')
if (!combinedChangelog) throw new Error('Could not find astro-expressive-code changelog')
combinedChangelog.versions.forEach((version) => mergeIncludes(version, changelogs, nonDefaultPackages))

// Generate markdown output
const output: string[] = []

output.push(
	// Add release notes frontmatter to output
	'---',
	'# Warning: This file is generated automatically. Do not edit!',
	'title: Release Notes',
	'---',
	'',
	'This page combines all release notes of the Expressive Code monorepo.',
	'You can find the source changelogs on GitHub in the subfolders of',
	'[`packages`](https://github.com/expressive-code/expressive-code/tree/main/packages).',
	''
)

const ast: Root = {
	type: 'root',
	children: [],
}

combinedChangelog.versions.forEach((version) => {
	const versionChanges: List = { type: 'list', children: [] }
	semverCategories.forEach((semverCategory) => {
		version.changes[semverCategory].children.forEach((listItem) => {
			versionChanges.children.push(listItem)
		})
	})
	if (version.includes.size) {
		versionChanges.children.push({
			type: 'listItem',
			children: [
				{
					type: 'paragraph',
					children: [{ type: 'text', value: `Includes: ${[...version.includes].join(', ')} ` }],
				},
			],
		})
	}
	if (!versionChanges.children.length) return

	ast.children.push({ type: 'heading', depth: 2, children: [{ type: 'text', value: version.version }] })
	ast.children.push(versionChanges)
})

output.push(toMarkdown(ast, { bullet: '-' }))

// Write output to file
writeFileLines('./src/content/docs/releases.md', output)
