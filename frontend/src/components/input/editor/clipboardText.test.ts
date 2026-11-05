import {describe, it, expect, afterEach} from 'vitest'
import {ref} from 'vue'
import {Editor} from '@tiptap/core'

import {createEditorExtensions, type EditorExtensionDeps} from './editorExtensions'
import {serializeSliceAsText} from './clipboardText'

window.API_URL = 'http://localhost:3456'

let editors: Editor[] = []

afterEach(() => {
	editors.forEach(editor => editor.destroy())
	editors = []
})

function plainTextOf(content: string): string {
	const holder = document.createElement('div')
	document.body.appendChild(holder)

	let editor: Editor
	const deps: EditorExtensionDeps = {
		t: key => key,
		isEditing: ref(true),
		isEditEnabled: () => true,
		placeholder: '',
		contentHasChanged: ref(false),
		bubbleSave: () => {},
		getEditor: () => editor,
		uploadCallback: undefined,
		uploadAndInsertFiles: () => {},
	}
	editor = new Editor({element: holder, extensions: createEditorExtensions(deps), content})
	editors.push(editor)

	return serializeSliceAsText(editor.state.doc.slice(0))
}

describe('serializeSliceAsText', () => {
	it('keeps bullet markers and puts list items on their own lines', () => {
		const text = plainTextOf('<p>start</p><ul><li><p>this</p></li><li><p>is</p></li></ul><p>end</p>')

		expect(text).toBe('start\n\n- this\n- is\n\nend')
	})

	it('numbers ordered list items', () => {
		expect(plainTextOf('<ol><li><p>one</p></li><li><p>two</p></li></ol>')).toBe('1. one\n2. two')
	})

	it('indents nested list items under their parent', () => {
		expect(plainTextOf('<ul><li><p>outer</p><ul><li><p>inner</p></li></ul></li></ul>'))
			.toBe('- outer\n  - inner')
	})

	it('keeps paragraph text separated by blank lines', () => {
		expect(plainTextOf('<p>a</p><p>b</p>')).toBe('a\n\nb')
	})
})
