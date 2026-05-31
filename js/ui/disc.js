const SVG_NS = 'http://www.w3.org/2000/svg'

function svgEl(tag, attrs = {}) {
	const el = document.createElementNS(SVG_NS, tag)
	for (const [k, v] of Object.entries(attrs)) {
		el.setAttribute(k, v)
	}
	return el
}

function polarToCartesian(cx, cy, radius, angleDeg) {
	const rad = (angleDeg - 90) * Math.PI / 180
	return {
		x: cx + radius * Math.cos(rad),
		y: cy + radius * Math.sin(rad)
	}
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
	const start = polarToCartesian(cx, cy, radius, endAngle)
	const end = polarToCartesian(cx, cy, radius, startAngle)
	const largeArc = endAngle - startAngle > 180 ? 1 : 0

	return [
		'M', start.x, start.y,
		'A', radius, radius, 0, largeArc, 0, end.x, end.y
	].join(' ')
}

function describeSector(cx, cy, radius, startAngle, endAngle) {
	const start = polarToCartesian(cx, cy, radius, startAngle)
	const end = polarToCartesian(cx, cy, radius, endAngle)
	const largeArc = endAngle - startAngle > 180 ? 1 : 0

	return [
		'M', cx, cy,
		'L', start.x, start.y,
		'A', radius, radius, 0, largeArc, 1, end.x, end.y,
		'Z'
	].join(' ')
}

const POSITION_COLORS = {
	pitcher: '#ffffff',
	catcher: '#ffffff',
	'first-base': '#aaaaaa',
	'second-base': '#aaaaaa',
	'third-base': '#aaaaaa',
	shortstop: '#aaaaaa',
	'left-field': '#c41e3a',
	'center-field': '#c41e3a',
	'right-field': '#c41e3a',
	outfield: '#c41e3a',
	infield: '#aaaaaa',
	'1b': '#aaaaaa',
	'2b': '#aaaaaa',
	'3b': '#aaaaaa',
	ss: '#aaaaaa',
	lf: '#c41e3a',
	cf: '#c41e3a',
	rf: '#c41e3a'
}

const POSITION_ABBREV = {
	pitcher: 'P',
	catcher: 'C',
	'first-base': '1B',
	'second-base': '2B',
	'third-base': '3B',
	shortstop: 'SS',
	'left-field': 'LF',
	'center-field': 'CF',
	'right-field': 'RF',
	outfield: 'OF',
	infield: 'IF',
	'1b': '1B',
	'2b': '2B',
	'3b': '3B',
	ss: 'SS',
	lf: 'LF',
	cf: 'CF',
	rf: 'RF'
}

const SECTOR_LABELS = {
	1: 'HR', 2: 'GB', 3: 'FB', 4: 'FB',
	5: '3B', 6: 'GB', 7: '1B', 8: 'FB',
	9: 'BB', 10: 'K', 11: '2B', 12: 'GB',
	13: '1B', 14: 'FB'
}

const STRATEGY_SECTORS_AE = [
	{ letter: 'A', angle: 36 },
	{ letter: 'E', angle: 36 },
	{ letter: 'C', angle: 36 },
	{ letter: 'C', angle: 36 },
	{ letter: 'D', angle: 36 },
	{ letter: 'B', angle: 36 },
	{ letter: 'E', angle: 36 },
	{ letter: 'A', angle: 36 },
	{ letter: 'B', angle: 36 },
	{ letter: 'D', angle: 36 },
]

const STRATEGY_SECTORS_FJ = [
	{ letter: 'I', angle: 36 },
	{ letter: 'H', angle: 36 },
	{ letter: 'G', angle: 36 },
	{ letter: 'J', angle: 36 },
	{ letter: 'F', angle: 36 },
	{ letter: 'G', angle: 36 },
	{ letter: 'H', angle: 36 },
	{ letter: 'I', angle: 36 },
	{ letter: 'J', angle: 36 },
	{ letter: 'F', angle: 36 },
]

export function createDiscSVG(disc, cx, cy, radius) {
	const g = svgEl('g', {
		'data-disc-id': disc.id ?? disc.name
	})

	const totalSize = disc.sectors.reduce((sum, s) => sum + s.size, 0)
	const centerRadius = 70

	let currentAngle = 0

	disc.sectors.forEach((sector, i) => {
		const sectorAngle = (sector.size / totalSize) * 360
		const endAngle = currentAngle + sectorAngle

		// Sector fill — alternate cream shades
		const fill = i % 2 === 0 ? '#f5f0e1' : '#e8e0cc'
		const path = svgEl('path', {
			d: describeSector(cx, cy, radius, currentAngle, endAngle),
			fill,
			stroke: '#555',
			'stroke-width': '0.5'
		})
		g.appendChild(path)

		// Sector number label at ~70% radius
		const labelAngle = currentAngle + sectorAngle / 2
		const labelR = radius * 0.72
		const labelPos = polarToCartesian(cx, cy, labelR, labelAngle)

		const label = svgEl('text', {
			x: labelPos.x,
			y: labelPos.y,
			'text-anchor': 'middle',
			'dominant-baseline': 'central',
			'font-size': sectorAngle < 15 ? '8' : '11',
			'font-weight': 'bold',
			fill: '#333',
			'font-family': 'system-ui, sans-serif'
		})
		label.textContent = SECTOR_LABELS[sector.number] ?? sector.number
		g.appendChild(label)

		// Radial separator line
		const lineStart = polarToCartesian(cx, cy, centerRadius, currentAngle)
		const lineEnd = polarToCartesian(cx, cy, radius, currentAngle)
		const line = svgEl('line', {
			x1: lineStart.x,
			y1: lineStart.y,
			x2: lineEnd.x,
			y2: lineEnd.y,
			stroke: '#555',
			'stroke-width': '1'
		})
		g.appendChild(line)

		currentAngle = endAngle
	})

	// Outer border
	const outerCircle = svgEl('circle', {
		cx, cy, r: radius,
		fill: 'none',
		stroke: '#333',
		'stroke-width': '2'
	})
	g.appendChild(outerCircle)

	// Center circle
	const posColor = POSITION_COLORS[disc.position?.toLowerCase()] ?? '#aaaaaa'
	const centerCircle = svgEl('circle', {
		cx, cy, r: centerRadius,
		fill: posColor,
		stroke: '#333',
		'stroke-width': '1.5'
	})
	g.appendChild(centerCircle)

	// Player name
	const nameText = svgEl('text', {
		x: cx,
		y: cy - 4,
		'text-anchor': 'middle',
		'dominant-baseline': 'central',
		'font-size': '12',
		'font-weight': '600',
		fill: '#111',
		'font-family': 'system-ui, sans-serif'
	})
	nameText.textContent = disc.name
	g.appendChild(nameText)

	// Position
	const posText = svgEl('text', {
		x: cx,
		y: cy + 10,
		'text-anchor': 'middle',
		'dominant-baseline': 'central',
		'font-size': '8',
		fill: '#333',
		'font-family': 'system-ui, sans-serif'
	})
	const posKey = (disc.position ?? '').toLowerCase()
	posText.textContent = POSITION_ABBREV[posKey] ?? posKey.toUpperCase()
	g.appendChild(posText)

	return g
}

export function createStrategyDiscSVG(cx, cy, radius, activeRing) {
	const g = svgEl('g')

	const outerR = radius
	const midR = radius * 0.65
	const innerR = radius * 0.35

	function renderRing(sectors, rOuter, rInner, baseFill, isActive) {
		const opacity = isActive ? 1 : 0.35
		let currentAngle = 0

		sectors.forEach((sector, i) => {
			const endAngle = currentAngle + sector.angle
			const startRad = (currentAngle - 90) * Math.PI / 180
			const endRad = (endAngle - 90) * Math.PI / 180

			const outerStart = {
				x: cx + rOuter * Math.cos(startRad),
				y: cy + rOuter * Math.sin(startRad)
			}
			const outerEnd = {
				x: cx + rOuter * Math.cos(endRad),
				y: cy + rOuter * Math.sin(endRad)
			}
			const innerEnd = {
				x: cx + rInner * Math.cos(endRad),
				y: cy + rInner * Math.sin(endRad)
			}
			const innerStart = {
				x: cx + rInner * Math.cos(startRad),
				y: cy + rInner * Math.sin(startRad)
			}

			const largeArc = sector.angle > 180 ? 1 : 0
			const d = [
				'M', outerStart.x, outerStart.y,
				'A', rOuter, rOuter, 0, largeArc, 1, outerEnd.x, outerEnd.y,
				'L', innerEnd.x, innerEnd.y,
				'A', rInner, rInner, 0, largeArc, 0, innerStart.x, innerStart.y,
				'Z'
			].join(' ')

			const fill = i % 2 === 0 ? baseFill : adjustBrightness(baseFill, -15)
			const path = svgEl('path', {
				d,
				fill,
				stroke: '#333',
				'stroke-width': '0.5',
				opacity
			})
			g.appendChild(path)

			const midAngle = currentAngle + sector.angle / 2
			const labelR = (rOuter + rInner) / 2
			const labelRad = (midAngle - 90) * Math.PI / 180
			const lx = cx + labelR * Math.cos(labelRad)
			const ly = cy + labelR * Math.sin(labelRad)

			const label = svgEl('text', {
				x: lx,
				y: ly,
				'text-anchor': 'middle',
				'dominant-baseline': 'central',
				'font-size': '11',
				'font-weight': 'bold',
				fill: '#fff',
				opacity,
				'font-family': 'system-ui, sans-serif'
			})
			label.textContent = sector.letter
			g.appendChild(label)

			currentAngle = endAngle
		})
	}

	renderRing(STRATEGY_SECTORS_AE, outerR, midR, '#c41e3a', activeRing === 'A-E')
	renderRing(STRATEGY_SECTORS_FJ, midR, innerR, '#222', activeRing === 'F-J')

	const center = svgEl('circle', {
		cx, cy, r: innerR,
		fill: '#f5f0e1',
		stroke: '#333',
		'stroke-width': '1'
	})
	g.appendChild(center)

	const titleText = svgEl('text', {
		x: cx,
		y: cy - 6,
		'text-anchor': 'middle',
		'dominant-baseline': 'central',
		'font-size': '9',
		'font-weight': 'bold',
		fill: '#222',
		'font-family': 'system-ui, sans-serif'
	})
	titleText.textContent = 'STRATEGY'
	g.appendChild(titleText)

	const ringText = svgEl('text', {
		x: cx,
		y: cy + 8,
		'text-anchor': 'middle',
		'dominant-baseline': 'central',
		'font-size': '10',
		'font-weight': 'bold',
		fill: activeRing === 'A-E' ? '#c41e3a' : '#222',
		'font-family': 'system-ui, sans-serif'
	})
	ringText.textContent = activeRing
	g.appendChild(ringText)

	return g
}

function adjustBrightness(hex, amount) {
	const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount))
	const gr = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount))
	const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount))
	return `#${r.toString(16).padStart(2, '0')}${gr.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
