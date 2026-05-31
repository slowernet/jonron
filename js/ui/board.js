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
		viewBox: '0 0 1024 420',
		width: '100%',
		preserveAspectRatio: 'xMidYMid meet'
	})

	// Background
	const bg = svgEl('rect', {
		width: '1024',
		height: '420',
		fill: 'var(--green)'
	})
	svg.appendChild(bg)

	// Spinner areas (placeholder groups)
	const visitorSpinnerArea = svgEl('g', { id: 'visitor-spinner-area' })
	svg.appendChild(visitorSpinnerArea)

	const homeSpinnerArea = svgEl('g', { id: 'home-spinner-area' })
	svg.appendChild(homeSpinnerArea)

	// Diamond area (placeholder group)
	const diamondGroup = svgEl('g', { id: 'diamond-group' })
	svg.appendChild(diamondGroup)

	container.appendChild(svg)

	return {
		svg,
		diamondGroup,
		visitorSpinnerArea,
		homeSpinnerArea,
		battingKey: createBattingKeyHTML()
	}
}

function createBattingKeyHTML() {
	const labels = [
		'HOME RUN', 'GROUND BALL', 'FLY BALL', 'FLY BALL',
		'TRIPLE', 'GROUND BALL', 'SINGLE', 'FLY BALL',
		'WALK', 'STRIKEOUT', 'DOUBLE', 'GROUND BALL',
		'SINGLE', 'FLY BALL'
	]

	const wrapper = document.createElement('div')
	wrapper.className = 'batting-key'

	const title = document.createElement('div')
	title.className = 'batting-key-title'
	title.textContent = 'BATTING KEY'
	wrapper.appendChild(title)

	const grid = document.createElement('div')
	grid.className = 'batting-key-grid'

	for (let i = 0; i < 14; i++) {
		const entry = document.createElement('div')
		entry.className = 'batting-key-entry'

		const num = document.createElement('span')
		num.className = 'batting-key-num'
		num.textContent = `${i + 1}.`

		const label = document.createElement('span')
		label.textContent = labels[i]

		entry.appendChild(num)
		entry.appendChild(label)
		grid.appendChild(entry)
	}

	wrapper.appendChild(grid)
	return wrapper
}
