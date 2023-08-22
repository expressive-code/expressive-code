import type { Root, Parent, Code, HTML } from 'mdast'
import { visit } from 'unist-util-visit'
import { replaceDelimitedValues } from 'expressive-code'

export type RemarkExpressiveCodeDocument = {
	/**
	 * The full path to the source file containing the code block.
	 */
	sourceFilePath?: string | undefined
}

export type NodeData = [Parent, Code]

export function collectCodeNodes(tree: Root): NodeData[] {
	const ungroupedCodeNodes: NodeData[] = []
	visit(tree, 'code', (code, index, parent) => {
		if (index === null || parent === null) return
		ungroupedCodeNodes.push([parent, code])
	})
	return ungroupedCodeNodes
}

export function groupCodeNodes(ungroupedNodes: NodeData[]) {
	const nodeGroups: NodeData[][] = []
	let currentNodeGroup: NodeData[] | undefined

	for (const [parent, code] of ungroupedNodes) {
		const metaTags = replaceDelimitedValues(code.meta ?? '', () => '').split(' ')
		const isGroupStart = metaTags.includes('group-start')
		const isGroupEnd = metaTags.includes('group-end')
		// If we have no current group or were instructed to start a new group,
		// create one now and add it
		if (!currentNodeGroup || isGroupStart) {
			currentNodeGroup = []
			nodeGroups.push(currentNodeGroup)
		}
		// Add the current node to the current group
		currentNodeGroup.push([parent, code])
		// If we were instructed to end the current group, do it now
		if (isGroupEnd) currentNodeGroup = []
	}

	return nodeGroups
}

export function replaceNodesWithRenderedHtml(nodeGroup: NodeData[], html: string) {
	const htmlNode: HTML = {
		type: 'html',
		value: html,
	}
	for (let i = 0; i < nodeGroup.length; i++) {
		const [parent, code] = nodeGroup[i]
		// Remove the current node from the document, and if it's the first node,
		// also insert the rendered HTML in its place
		const nodesToInsert = i === 0 ? [htmlNode] : []
		parent.children.splice(parent.children.indexOf(code), 1, ...nodesToInsert)
	}
}
