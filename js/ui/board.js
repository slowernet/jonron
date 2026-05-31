import { BATTING_KEY } from '../game/rules.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

function svgEl(tag, attrs = {}) {
	const el = document.createElementNS(SVG_NS, tag)
	for (const [k, v] of Object.entries(attrs)) {
		el.setAttribute(k, v)
	}
	return el
}

export function createBoard(container) {
	container.textContent = ''

	const svg = svgEl('svg', {
		viewBox: '0 0 1024 768',
		width: '100%',
		height: '100%',
		preserveAspectRatio: 'xMidYMid meet'
	})

	// Background
	const bg = svgEl('rect', {
		width: '1024',
		height: '768',
		fill: 'var(--green)'
	})
	svg.appendChild(bg)

	// Title
	const title = svgEl('text', {
		x: '512',
		y: '40',
		'text-anchor': 'middle',
		'font-size': '28',
		'font-weight': 'bold',
		fill: 'var(--cream)',
		'font-family': 'system-ui, sans-serif'
	})
	title.textContent = 'JONRÓN BASEBALL'
	svg.appendChild(title)

	// Side labels
	const visitorLabel = svgEl('text', {
		x: '60',
		y: '384',
		'text-anchor': 'middle',
		'font-size': '14',
		'font-weight': 'bold',
		fill: 'var(--yellow)',
		'font-family': 'system-ui, sans-serif',
		transform: 'rotate(-90, 60, 384)'
	})
	visitorLabel.textContent = 'VISITORS AT BAT'
	svg.appendChild(visitorLabel)

	const homeLabel = svgEl('text', {
		x: '964',
		y: '384',
		'text-anchor': 'middle',
		'font-size': '14',
		'font-weight': 'bold',
		fill: 'var(--yellow)',
		'font-family': 'system-ui, sans-serif',
		transform: 'rotate(90, 964, 384)'
	})
	homeLabel.textContent = 'HOME AT BAT'
	svg.appendChild(homeLabel)

	// Spinner areas (placeholder groups)
	const visitorSpinnerArea = svgEl('g', { id: 'visitor-spinner-area' })
	svg.appendChild(visitorSpinnerArea)

	const homeSpinnerArea = svgEl('g', { id: 'home-spinner-area' })
	svg.appendChild(homeSpinnerArea)

	// Diamond area (placeholder group)
	const diamondGroup = svgEl('g', { id: 'diamond-group' })
	svg.appendChild(diamondGroup)

	// Batting key panel
	const keyPanel = createBattingKey(512, 640)
	svg.appendChild(keyPanel)

	container.appendChild(svg)

	return {
		svg,
		diamondGroup,
		visitorSpinnerArea,
		homeSpinnerArea,
		keyPanel
	}
}

function createBattingKey(cx, cy) {
	const g = svgEl('g', { id: 'batting-key' })

	// Background panel
	const panelW = 520
	const panelH = 110
	const panel = svgEl('rect', {
		x: cx - panelW / 2,
		y: cy - panelH / 2,
		width: panelW,
		height: panelH,
		rx: '6',
		ry: '6',
		fill: 'var(--green-dark)',
		stroke: 'var(--yellow)',
		'stroke-width': '2'
	})
	g.appendChild(panel)

	// Title
	const title = svgEl('text', {
		x: cx,
		y: cy - panelH / 2 + 18,
		'text-anchor': 'middle',
		'font-size': '13',
		'font-weight': 'bold',
		fill: 'var(--yellow)',
		'font-family': 'system-ui, sans-serif'
	})
	title.textContent = 'BATTING KEY'
	g.appendChild(title)

	const labels = {
		1: 'HOME RUN',
		2: 'GROUND BALL',
		3: 'FLY BALL',
		4: 'FLY BALL',
		5: 'TRIPLE',
		6: 'GROUND BALL',
		7: 'SINGLE',
		8: 'FLY BALL',
		9: 'WALK',
		10: 'STRIKEOUT',
		11: 'DOUBLE',
		12: 'GROUND BALL',
		13: 'SINGLE',
		14: 'FLY BALL'
	}

	const cols = 2
	const rows = 7
	const colW = 240
	const rowH = 12
	const startX = cx - panelW / 2 + 20
	const startY = cy - panelH / 2 + 32

	for (let i = 1; i <= 14; i++) {
		const col = i <= 7 ? 0 : 1
		const row = i <= 7 ? i - 1 : i - 8

		const x = startX + col * colW
		const y = startY + row * rowH

		const numText = svgEl('text', {
			x: x,
			y: y + 9,
			'font-size': '10',
			'font-weight': 'bold',
			fill: 'var(--cream)',
			'font-family': 'system-ui, sans-serif'
		})
		numText.textContent = `${i}.`
		g.appendChild(numText)

		const labelText = svgEl('text', {
			x: x + 22,
			y: y + 9,
			'font-size': '10',
			fill: 'var(--cream)',
			'font-family': 'system-ui, sans-serif'
		})
		labelText.textContent = labels[i]
		g.appendChild(labelText)
	}

	return g
}
