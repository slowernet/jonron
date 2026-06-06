export function createNarrator(container) {
	const el = document.createElement('div')
	el.className = 'jr-narrator'
	container.appendChild(el)
	return el
}

export function narrate(narrator, text, { highlight = false } = {}) {
	const line = document.createElement('div')
	line.className = 'narrator-line'
	if (highlight) line.classList.add('narrator-highlight')
	line.textContent = text
	narrator.appendChild(line)
	// keep the log from growing unbounded
	while (narrator.children.length > 60) narrator.removeChild(narrator.firstChild)
	narrator.scrollTop = narrator.scrollHeight
}
