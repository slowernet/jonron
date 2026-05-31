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
	'1b': '#aaaaaa',
	'2b': '#aaaaaa',
	'3b': '#aaaaaa',
	ss: '#aaaaaa',
	shortstop: '#aaaaaa',
	infield: '#aaaaaa',
	lf: '#c41e3a',
	cf: '#c41e3a',
	rf: '#c41e3a',
	outfield: '#c41e3a'
}

export function createDiscSVG(disc, cx, cy, radius) {
	const g = svgEl('g', {
		'data-disc-id': disc.id ?? disc.name
	})

	const totalSize = disc.sectors.reduce((sum, s) => sum + s.size, 0)
	const centerRadius = radius * 0.28

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
			'font-family': 'system-ui, sans-serif',
			transform: `rotate(${labelAngle}, ${labelPos.x}, ${labelPos.y})`
		})
		label.textContent = sector.number
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
		'font-size': '10',
		'font-weight': 'bold',
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
	posText.textContent = (disc.position ?? '').toUpperCase()
	g.appendChild(posText)

	return g
}
