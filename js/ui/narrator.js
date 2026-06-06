import { MAX_NARRATOR_LINES } from '../constants.js'

export function createNarrator(container) {
	const el = document.createElement('div')
	el.className = 'jr-narrator'
	container.appendChild(el)
	return el
}

export function narrate(narrator, text, { highlight = false, replace = false } = {}) {
	if (replace && narrator.lastChild) {
		const last = narrator.lastChild
		last.textContent = text
		if (highlight) last.classList.add('narrator-highlight')
		narrator.scrollTop = narrator.scrollHeight
		return
	}
	const line = document.createElement('div')
	line.className = 'narrator-line'
	if (highlight) line.classList.add('narrator-highlight')
	line.textContent = text
	narrator.appendChild(line)
	while (narrator.children.length > MAX_NARRATOR_LINES) narrator.removeChild(narrator.firstChild)
	narrator.scrollTop = narrator.scrollHeight
}
