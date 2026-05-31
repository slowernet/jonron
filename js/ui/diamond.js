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

	// Infield dirt — horseshoe arc extending beyond baselines
	const dirtColor = '#a0784a'
	const ext = half * 0.3
	const inv = 1 / Math.SQRT2

	// Extend foul lines past the bases
	const past3B = { x: third.x - inv * ext, y: third.y - inv * ext }
	const past1B = { x: first.x + inv * ext, y: first.y - inv * ext }

	// Arc radius — smaller values create more outward bulge
	const dirtR = half * 0.82
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

	// Home plate dirt circle
	const homeDirt = svgEl('circle', {
		cx: home.x, cy: home.y, r: half * 0.22,
		fill: dirtColor
	})
	g.appendChild(homeDirt)

	// Infield grass — rounded square inside the baselines
	const gi = half * 0.30
	const gHome = { x: home.x, y: home.y - gi * 1.4 }
	const gFirst = { x: first.x - gi * 1.05, y: first.y + gi * 0.1 }
	const gSecond = { x: second.x, y: second.y + gi * 1.05 }
	const gThird = { x: third.x + gi * 1.05, y: third.y + gi * 0.1 }
	const gr = half * 0.15
	const grassPath = svgEl('path', {
		d: [
			`M ${gHome.x},${gHome.y}`,
			`Q ${(gHome.x + gFirst.x) / 2 + gr * 0.3},${(gHome.y + gFirst.y) / 2 - gr * 0.3} ${gFirst.x},${gFirst.y}`,
			`Q ${(gFirst.x + gSecond.x) / 2 + gr * 0.3},${(gFirst.y + gSecond.y) / 2 - gr * 0.3} ${gSecond.x},${gSecond.y}`,
			`Q ${(gSecond.x + gThird.x) / 2 - gr * 0.3},${(gSecond.y + gThird.y) / 2 - gr * 0.3} ${gThird.x},${gThird.y}`,
			`Q ${(gThird.x + gHome.x) / 2 - gr * 0.3},${(gThird.y + gHome.y) / 2 - gr * 0.3} ${gHome.x},${gHome.y}`,
			'Z'
		].join(' '),
		fill: 'var(--green)'
	})
	g.appendChild(grassPath)

	// Baselines (disconnected from home plate)
	const baselineStyle = { fill: 'none', stroke: '#ffffff', 'stroke-width': '2', 'stroke-opacity': '0.9' }
	const gap = half * 0.22
	const gapInv = gap * inv

	// 3B foul line (from near home to 3B)
	const foul3Start = { x: home.x - gapInv, y: home.y - gapInv }
	g.appendChild(svgEl('line', { ...baselineStyle, x1: foul3Start.x, y1: foul3Start.y, x2: third.x, y2: third.y }))

	// 3B to 2B
	g.appendChild(svgEl('line', { ...baselineStyle, x1: third.x, y1: third.y, x2: second.x, y2: second.y }))

	// 2B to 1B
	g.appendChild(svgEl('line', { ...baselineStyle, x1: second.x, y1: second.y, x2: first.x, y2: first.y }))

	// 1B foul line (from 1B to near home)
	const foul1Start = { x: home.x + gapInv, y: home.y - gapInv }
	g.appendChild(svgEl('line', { ...baselineStyle, x1: first.x, y1: first.y, x2: foul1Start.x, y2: foul1Start.y }))

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
