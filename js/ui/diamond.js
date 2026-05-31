const SVG_NS = 'http://www.w3.org/2000/svg'

function svgEl(tag, attrs = {}) {
	const el = document.createElementNS(SVG_NS, tag)
	for (const [k, v] of Object.entries(attrs)) {
		el.setAttribute(k, v)
	}
	return el
}

export function createDiamond(svg, cx, cy, size) {
	const g = svgEl('g', { id: 'diamond' })

	const half = size / 2

	// Base positions (diamond orientation: home at bottom, 2B at top)
	const home = { x: cx, y: cy + half }
	const first = { x: cx + half, y: cy }
	const second = { x: cx, y: cy - half }
	const third = { x: cx - half, y: cy }

	// Infield dirt — connected from home along foul lines through arc
	const dirtColor = '#a0784a'
	const inv = 1 / Math.SQRT2
	const foulExt = half * 0.3

	// Foul line extensions past the bases
	const past3B = { x: third.x - inv * foulExt, y: third.y - inv * foulExt }
	const past1B = { x: first.x + inv * foulExt, y: first.y - inv * foulExt }

	// Arc radius for dirt behind bases
	const dirtR = half * 0.82

	// Dirt along foul lines widens from home to the bases
	const dirtWidth = half * 0.06
	const dirtArc = svgEl('path', {
		d: [
			`M ${home.x},${home.y}`,
			`L ${past3B.x},${past3B.y}`,
			`A ${dirtR} ${dirtR} 0 0 1 ${past1B.x},${past1B.y}`,
			'Z'
		].join(' '),
		fill: dirtColor
	})
	g.appendChild(dirtArc)

	// Home plate dirt circle (larger, like real fields)
	const homeDirt = svgEl('circle', {
		cx: home.x, cy: home.y, r: half * 0.28,
		fill: dirtColor
	})
	g.appendChild(homeDirt)

	// Infield grass — perfect rotated square, equal inset on all sides
	const gi = half * 0.28
	const grassPath = svgEl('polygon', {
		points: [
			`${cx},${cy + half - gi}`,
			`${cx + half - gi},${cy}`,
			`${cx},${cy - half + gi}`,
			`${cx - half + gi},${cy}`
		].join(' '),
		fill: 'var(--green)'
	})
	g.appendChild(grassPath)

	// Baselines (full diamond) and foul line extensions past bases
	const lineStyle = { fill: 'none', stroke: '#ffffff', 'stroke-width': '2', 'stroke-opacity': '0.9' }

	// Full diamond: home → 1B → 2B → 3B → home
	const diamond = svgEl('polygon', {
		...lineStyle,
		points: `${home.x},${home.y} ${first.x},${first.y} ${second.x},${second.y} ${third.x},${third.y}`,
		'stroke-linejoin': 'round'
	})
	g.appendChild(diamond)

	// Foul line extensions past bases
	g.appendChild(svgEl('line', { ...lineStyle, x1: first.x, y1: first.y, x2: past1B.x, y2: past1B.y }))
	g.appendChild(svgEl('line', { ...lineStyle, x1: third.x, y1: third.y, x2: past3B.x, y2: past3B.y }))

	// Pitcher's mound (60.5ft from home on a 127.3ft diagonal = ~47.5% from home)
	const mound = svgEl('circle', {
		cx: cx,
		cy: cy + half * 0.05,
		r: 7,
		fill: '#c4a265',
		stroke: '#8a7040',
		'stroke-width': '1.5'
	})
	g.appendChild(mound)

	// Home plate (flat top, point at bottom)
	const hp = 10
	const homePlate = svgEl('polygon', {
		points: [
			`${home.x - hp},${home.y - hp * 0.6}`,
			`${home.x + hp},${home.y - hp * 0.6}`,
			`${home.x + hp},${home.y + hp * 0.2}`,
			`${home.x},${home.y + hp}`,
			`${home.x - hp},${home.y + hp * 0.2}`
		].join(' '),
		fill: '#ffffff',
		stroke: '#ccc',
		'stroke-width': '1.5'
	})
	g.appendChild(homePlate)

	// Base markers (1B, 2B, 3B)
	const baseSize = 11
	const baseMarkers = {}

	const basePositions = { first, second, third }
	for (const [name, pos] of Object.entries(basePositions)) {
		const marker = svgEl('rect', {
			x: pos.x - baseSize / 2,
			y: pos.y - baseSize / 2,
			width: baseSize,
			height: baseSize,
			transform: `rotate(45, ${pos.x}, ${pos.y})`,
			fill: '#ffffff',
			stroke: '#888',
			'stroke-width': '1'
		})
		g.appendChild(marker)
		baseMarkers[name] = marker
	}

	// Runner pegs (initially hidden)
	const runners = {}
	for (const [name, pos] of Object.entries(basePositions)) {
		const peg = svgEl('circle', {
			cx: pos.x,
			cy: pos.y,
			r: 7,
			fill: 'var(--yellow)',
			stroke: '#8a6d00',
			'stroke-width': '1.5',
			opacity: '0'
		})
		g.appendChild(peg)
		runners[name] = peg
	}

	svg.appendChild(g)

	return {
		element: g,
		baseMarkers,
		runners,
		positions: { home, first, second, third }
	}
}

export function updateRunners(diamond, bases) {
	const mapping = {
		first: bases.first,
		second: bases.second,
		third: bases.third
	}

	for (const [base, playerId] of Object.entries(mapping)) {
		const peg = diamond.runners[base]
		const show = playerId != null

		if (typeof gsap !== 'undefined') {
			gsap.to(peg, {
				attr: { opacity: show ? 1 : 0 },
				duration: 0.25,
				ease: 'power2.out'
			})
			if (show) {
				gsap.fromTo(peg,
					{ attr: { r: 0 } },
					{ attr: { r: 7 }, duration: 0.3, ease: 'back.out(2)' }
				)
			}
		} else {
			peg.setAttribute('opacity', show ? '1' : '0')
		}
	}
}
