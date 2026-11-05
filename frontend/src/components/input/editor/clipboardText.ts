import type {Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

// Plain text for copies out of the editor. Blocks are separated by blank lines like the
// default serializer, but list items keep their markers so a copied list still reads as one.
export function serializeSliceAsText(slice: Slice): string {
	const blocks: string[] = []
	slice.content.forEach(node => blocks.push(blockText(node)))
	return blocks.join('\n\n')
}

function blockText(node: ProseMirrorNode): string {
	if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
		return listText(node)
	}

	if (node.isTextblock) {
		return node.textBetween(0, node.content.size, undefined, leafText)
	}

	const parts: string[] = []
	node.forEach(child => parts.push(blockText(child)))
	return parts.join('\n\n')
}

function listText(list: ProseMirrorNode): string {
	const ordered = list.type.name === 'orderedList'
	const items: string[] = []

	list.forEach((item, _offset, index) => {
		const marker = ordered ? `${index + 1}. ` : '- '
		const [first, ...rest] = listItemText(item).split('\n')
		const indent = ' '.repeat(marker.length)
		items.push([marker + first, ...rest.map(line => indent + line)].join('\n'))
	})

	return items.join('\n')
}

function listItemText(item: ProseMirrorNode): string {
	const parts: string[] = []
	item.forEach(child => parts.push(blockText(child)))
	return parts.join('\n')
}

function leafText(node: ProseMirrorNode): string {
	if (node.type.name === 'hardBreak') {
		return '\n'
	}

	// Matches the text a task link renders as.
	if (node.type.name === 'taskLink') {
		return String(node.attrs.href ?? '')
	}

	return ''
}
