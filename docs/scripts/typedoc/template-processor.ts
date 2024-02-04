/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import { globSync } from 'glob'
import { parse } from 'yaml'
import GithubSlugger from 'github-slugger'
import { readFileLines, normalizeLineEndings, splitLines, writeFileLines } from './utils'

type IncludeDirective = {
	name: string
	headingLevel: number
	removeSections?: string[] | undefined
	editSections?:
		| {
				path: string
				// Possible edits
				replaceWith?: string | undefined
				replaceHeading?: string | undefined
				append?: string | undefined
		  }[]
		| undefined
	replacements?: { search: string; replace: string }[] | undefined
}

export function processTemplate({ apiDocsPath, templateFilePath, outputFilePath }: { apiDocsPath: string; templateFilePath: string; outputFilePath: string }) {
	console.log('Processing template:', templateFilePath)
	let markdown = normalizeLineEndings(fs.readFileSync(templateFilePath, 'utf8'))
	markdown = markdown.replace(/````ya?ml include\n([\s\S]+?)\n````/g, (_, yaml: string) => {
		const directive = parse(yaml) as IncludeDirective
		if (!directive.name || !(directive.headingLevel > 1)) throw new Error(`Invalid include directive: ${yaml}`)
		const lines = readFileLines(findApiDocsFile(apiDocsPath, directive.name))
		// Remove last line if it's empty
		if (lines[lines.length - 1]?.trim() === '') lines.pop()
		// Change heading levels to match the template
		let headings = collectHeadings(lines)
		if (headings.length) {
			const headingLevelOffset = directive.headingLevel - headings[0]!.level
			headings.forEach((heading) => {
				heading.level = Math.max(1, heading.level + headingLevelOffset)
				lines[heading.lineIdx] = '#'.repeat(heading.level) + ' ' + heading.text
			})
		}

		directive.removeSections?.forEach((path) => {
			const pathRegExp = new RegExp(path)
			let headingIdx: number
			let matches = 0
			while ((headingIdx = headings.findIndex((h) => h.textPath.match(pathRegExp))) !== -1) {
				matches++
				const heading = headings[headingIdx]!
				// Find the end line index of the section
				const nextSectionHeading = headings.slice(headingIdx + 1).find((h) => h.level <= heading.level)
				const sectionEndLineIdx = (nextSectionHeading?.lineIdx ?? lines.length) - 1
				// Remove the section
				lines.splice(heading.lineIdx, sectionEndLineIdx - heading.lineIdx + 1)
				// Update the headings
				headings = collectHeadings(lines)
			}
			if (!matches) throw new Error(`No headings found for removeSections path "${path}". Available paths: ${headings.map((h) => `"${h.textPath}"`).join(', ')}`)
		})

		directive.editSections?.forEach((edit) => {
			const headingIdx = headings.findIndex((h) => h.textPath === edit.path)
			const heading = headings[headingIdx]
			if (!heading)
				throw new Error(
					`No headings found for editSections path "${edit.path}". Possible matches: ${headings
						.filter((h) => h.textPath.endsWith(edit.path))
						.map((h) => `"${h.textPath}"`)
						.join(', ')}?`
				)
			if (edit.replaceWith !== undefined) {
				// Find the end line index of the section
				const nextSectionHeading = headings.slice(headingIdx + 1).find((h) => h.level <= heading.level)
				const sectionEndLineIdx = (nextSectionHeading?.lineIdx ?? lines.length) - 1
				if (edit.replaceWith.length) {
					// Replace the section contents
					lines.splice(heading.lineIdx + 1, sectionEndLineIdx - heading.lineIdx, '', ...splitLines(edit.replaceWith))
				} else {
					// Remove the section
					lines.splice(heading.lineIdx, sectionEndLineIdx - heading.lineIdx + 1)
				}
				// Update the headings
				headings = collectHeadings(lines)
				return
			}
			if (edit.replaceHeading !== undefined) {
				if (edit.replaceHeading) {
					// Replace the heading
					lines[heading.lineIdx] = '#'.repeat(heading.level) + ' ' + edit.replaceHeading
				} else {
					// Remove the heading (and the line after it if it's empty)
					lines.splice(heading.lineIdx, lines[heading.lineIdx + 1]?.trim() === '' ? 2 : 1)
				}
				// Update the headings
				headings = collectHeadings(lines)
				return
			}
			if (edit.append) {
				// Find the line index of the next heading
				const nextHeading = headings[headingIdx + 1]
				const nextHeadingLineIdx = nextHeading?.lineIdx ?? lines.length
				// Insert the new lines before the next heading
				lines.splice(nextHeadingLineIdx, 0, ...splitLines(edit.append))
				// Update the headings
				headings = collectHeadings(lines)
				return
			}
			throw new Error(`Unsupported edit section directive: ${JSON.stringify(edit)}`)
		})

		directive.replacements?.forEach((replacement) => {
			const regex = new RegExp(replacement.search, 'g')
			lines.forEach((line, lineIdx) => {
				lines[lineIdx] = line.replace(regex, replacement.replace)
			})
		})

		return lines.join('\n')
	})

	// Auto-import known components after frontmatter
	const components = new Map<string, string>([
		['<PropertySignature>', `import PropertySignature from '@components/PropertySignature.astro'`],
		['<ConfigVariants ', `import ConfigVariants from '@components/ConfigVariants.astro'`],
		['<Code ', `import { Code } from '@astrojs/starlight/components'`],
	])
	components.forEach((importStatement, searchTerm) => {
		if (markdown.includes(searchTerm)) {
			markdown = addAfterEndOfFrontmatter(markdown, `${importStatement}`)
		}
	})

	// Add warning about auto-generated content
	markdown = markdown.replace(
		/^(---\n)/,
		`---
# WARNING: Do not edit this file directly, your changes will be overwritten!
# This file is auto-generated from a template inside "scripts/typedoc/templates".
		`.trim() + '\n'
	)

	writeFileLines(outputFilePath, markdown)
}

function collectHeadings(lines: string[]) {
	const slugger = new GithubSlugger()
	// Get all markdown headings with their line indices
	const headings = lines
		.map((line, lineIdx) => {
			const text = line.replace(/^(#+) /, '')
			return {
				lineIdx,
				level: (line.match(/^(#+) /)?.[1] ?? '').length,
				text,
				textPath: '',
				anchor: '#' + slugger.slug(text, false),
			}
		})
		.filter((heading) => heading.level > 0)
	// Go through the headings and build a path of all higher-level headings leading up to each one
	const findParentHeading = (heading: (typeof headings)[0]) => {
		const headingIdx = headings.indexOf(heading)
		return headings.slice(0, headingIdx).findLast((h) => h.level < heading.level)
	}
	headings.forEach((heading) => {
		let parentHeading = findParentHeading(heading)
		let textPath = heading !== headings[0] ? heading.text : ''
		while (parentHeading) {
			if (parentHeading !== headings[0]) textPath = parentHeading.text + '/' + textPath
			parentHeading = findParentHeading(parentHeading)
		}
		heading.textPath = textPath
	})
	return headings
}

function addAfterEndOfFrontmatter(markdown: string, addition: string) {
	return markdown.replace(/^(---\n[\s\S]+?\n---\n\n?)(.+?\n)/, (_, frontmatter: string, followingLine: string) => {
		return [
			frontmatter,
			addition,
			// Add an empty line if the following line is not an import
			followingLine.startsWith('import') ? '\n' : '\n\n',
			followingLine,
		].join('')
	})
}

let apiDocsIndex: string[]

function findApiDocsFile(apiDocsPath: string, name: string) {
	if (!apiDocsIndex) {
		apiDocsIndex = globSync(`**/*.mdx`, {
			cwd: apiDocsPath,
			posix: true,
		})
	}
	const matches = apiDocsIndex.filter((n) => n.endsWith(`/${name}.mdx`))
	if (matches.length === 0) throw new Error(`No API docs file found for "${name}"`)
	if (matches.length > 1) throw new Error(`Multiple API docs files found for "${name}": ${matches.join(', ')}`)
	return path.join(apiDocsPath, matches[0]!)
}

export function fixLinks(docsDir: string, templateFileSubpaths: string[]) {
	// Collect available anchors per page
	const nameToLinks = new Map<string, string[]>()
	const pathToLinks = new Map<string, string[]>()
	templateFileSubpaths.forEach((templateFileSubpath) => {
		const lines = readFileLines(path.join(docsDir, templateFileSubpath))
		const headings = collectHeadings(lines)
		headings.forEach((heading) => {
			const newLink = `/${templateFileSubpath.replace(/\.mdx?$/, '')}/${heading.anchor}`
			let nameLinks = nameToLinks.get(heading.text)
			if (!nameLinks) nameToLinks.set(heading.text, (nameLinks = []))
			nameLinks.push(newLink)
			let pathLinks = pathToLinks.get(heading.textPath)
			if (!pathLinks) pathToLinks.set(heading.textPath, (pathLinks = []))
			pathLinks.push(newLink)
		})
	})

	// Go through all pages and replace links
	templateFileSubpaths.forEach((templateFileSubpath) => {
		const lines = readFileLines(path.join(docsDir, templateFileSubpath))
		lines.forEach((line, lineIdx) => {
			lines[lineIdx] = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match: string, text: string, link: string) => {
				// Check if the link is an API link
				const targetMatch = link.match(/^\/api\/.*\/(.+?)\/(?:#([^/]+?))?$/)
				const apiTargetName = targetMatch?.[1]
				if (apiTargetName) {
					const optSubTarget = targetMatch?.[2]
					let links: string[]
					if (!optSubTarget) {
						links = nameToLinks.get(apiTargetName) ?? []
					} else {
						links =
							[...pathToLinks.entries()].find(([path]) => {
								return path.includes(apiTargetName) && path.toLowerCase().includes(optSubTarget.toLowerCase())
							})?.[1] ?? []
					}
					if (!links.length) {
						console.warn(`Removing link to "${apiTargetName}${optSubTarget ? `>${optSubTarget}` : ''}" in "${templateFileSubpath}"`)
						return text
					}
					if (links.length > 1) {
						console.warn(`Multiple links found for "${apiTargetName}": ${links.join(', ')}`)
						return text
					}
					return `[${text}](${links[0]})`
				}
				return match
			})
		})

		// Update the file
		writeFileLines(path.join(docsDir, templateFileSubpath), lines)
	})
}
