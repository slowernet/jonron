const SVG_NS = 'http://www.w3.org/2000/svg'

function svgEl(tag, attrs = {}) {
	const el = document.createElementNS(SVG_NS, tag)
	for (const [k, v] of Object.entries(attrs)) {
		el.setAttribute(k, v)
	}
	return el
}

export function createBoard(container) {
	const svg = svgEl('svg', {
		viewBox: '0 0 740 420',
		width: '100%',
		preserveAspectRatio: 'xMidYMid meet'
	})

	// Background
	const bg = svgEl('rect', {
		width: '740',
		height: '420',
		fill: 'var(--green)'
	})
	svg.appendChild(bg)

	container.appendChild(svg)

	return { svg }
}
